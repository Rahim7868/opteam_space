<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Role;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        // Permission de consulter les acteurs
        if (!auth()->user()->hasPermission('modifier_acteurs')) {
            abort(403, 'Permission refusée.');
        }

        $query = User::query()
            ->with('role', 'service', 'modificationProposeePar', 'modificationApprouveePar')
            ->latest();

        // Recherche améliorée : nom, email, adresse, fonction
        if (request('search')) {
            $search = request('search');
            $query->where(fn($q) => $q
                ->where('nom', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('adresse', 'like', "%{$search}%")
                ->orWhere('fonction', 'like', "%{$search}%")
            );
        }

        if (request('role_id')) {
            $query->where('role_id', request('role_id'));
        }

        if (request()->has('is_active')) {
            $query->where('is_active', request('is_active'));
        }

        // Nouveau : filtre par agence
        if (request('agence_id')) {
            $query->whereHas('service.departement.direction.agence', function($q) {
                $q->where('id', request('agence_id'));
            });
        }

        return UserResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(UserStoreRequest $request): UserResource
    {
        // Permission de créer un acteur
        if (!auth()->user()->hasPermission('creer_acteurs')) {
            abort(403, 'Permission refusée.');
        }

        $user = User::create([
            ...$request->validated(),
            'password'             => Hash::make('00000000'),
            'must_change_password' => true,
            'is_active'            => true,
        ]);

        AuditLogger::forModel('user_created', $user, 'Création de l\'acteur ' . $user->nom);

        return new UserResource($user->load('role', 'service'));
    }

    public function show(User $user): UserResource
    {
        // Permission de voir un acteur
        if (!auth()->user()->hasPermission('modifier_acteurs')) {
            abort(403, 'Permission refusée.');
        }

        return new UserResource(
            $user->load('role', 'service', 'permissionsDirectes', 'permissionsRetirees')
        );
    }

    public function update(UserUpdateRequest $request, User $user): JsonResponse|UserResource
    {
        // Permission de modifier un acteur
        if (!auth()->user()->hasPermission('modifier_acteurs')) {
            abort(403, 'Permission refusée.');
        }

        // Stocker les modifications en attente au lieu de les appliquer directement
        $data = $request->validated();

        // Ne conserver QUE les champs qui ont réellement changé
        $changes = [];
        foreach ($data as $key => $value) {
            $currentValue = $user->{$key};
            if (is_numeric($currentValue) && is_numeric($value)) {
                if ((int)$currentValue !== (int)$value) {
                    $changes[$key] = $value;
                }
            } else {
                if ((string)($currentValue ?? '') !== (string)($value ?? '')) {
                    $changes[$key] = $value;
                }
            }
        }

        if (empty($changes)) {
            return response()->json([
                'message' => 'Aucune modification détectée.'
            ], 422);
        }

        $user->update([
            'statut_modification' => 'en_attente_validation_modification',
            'modification_proposee' => $changes,
            'modification_proposee_par' => auth()->id(),
            'modification_approuvee_par' => null,
            'modification_approuvee_at' => null,
        ]);

        AuditLogger::forModel(
            'user_modification_proposee',
            $user,
            'Proposition de modification de l\'acteur ' . $user->nom . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications proposées. En attente de validation.',
            'user' => new UserResource($user->load('role', 'service', 'modificationProposeePar', 'modificationApprouveePar'))
        ]);
    }

    // Nouvelle methode : Approuver une modification
    public function approuverModification(User $user): JsonResponse
    {
        // Permission d'approuver les modifications
        if (!auth()->user()->hasPermission('approuver_modification_user')) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission d\'approuver les modifications.'
            ], 403);
        }

        if (!$user->modification_proposee || $user->statut_modification !== 'en_attente_validation_modification') {
            return response()->json([
                'message' => 'Aucune modification en attente pour cet acteur.'
            ], 422);
        }

        // Exception pour l'admin : peut s'auto-approuver
        $isAdmin = auth()->user()->hasPermission('creer_acteurs') && auth()->user()->hasPermission('modifier_acteurs');

        // Empêcher l'auto-approbation pour les utilisateurs qui ne sont PAS admin
        if (!$isAdmin && auth()->id() === $user->modification_proposee_par) {
            return response()->json([
                'message' => 'Vous ne pouvez pas approuver vos propres modifications.'
            ], 403);
        }

        // Appliquer les modifications
        $user->update([
            ...$user->modification_proposee,
            'statut_modification' => null,
            'modification_proposee' => null,
            'modification_proposee_par' => null,
            'modification_approuvee_par' => auth()->id(),
            'modification_approuvee_at' => now(),
        ]);

        AuditLogger::forModel(
            'user_modification_approuvee',
            $user,
            'Approbation de la modification de l\'acteur ' . $user->nom . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications appliquées définitivement.',
            'user' => new UserResource($user->load('role', 'service', 'modificationProposeePar', 'modificationApprouveePar'))
        ]);
    }

    // Nouvelle methode : Rejeter une modification
    public function rejeterModification(User $user): JsonResponse
    {
        // Permission d'approuver les modifications (meme permission)
        if (!auth()->user()->hasPermission('approuver_modification_user')) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission de gérer les modifications.'
            ], 403);
        }

        if (!$user->modification_proposee || $user->statut_modification !== 'en_attente_validation_modification') {
            return response()->json([
                'message' => 'Aucune modification en attente pour cet acteur.'
            ], 422);
        }

        // Exception pour l'admin : peut s'auto-approuver (et auto-rejeter)
        $isAdmin = auth()->user()->hasPermission('creer_acteurs') && auth()->user()->hasPermission('modifier_acteurs');

        // Empêcher l'auto-approbation pour les utilisateurs qui ne sont PAS admin
        if (!$isAdmin && auth()->id() === $user->modification_proposee_par) {
            return response()->json([
                'message' => 'Vous ne pouvez pas rejeter vos propres modifications.'
            ], 403);
        }

        // Rejeter les modifications
        $user->update([
            'statut_modification' => null,
            'modification_proposee' => null,
            'modification_proposee_par' => null,
            'modification_approuvee_par' => auth()->id(),
            'modification_approuvee_at' => now(),
        ]);

        AuditLogger::forModel(
            'user_modification_rejetee',
            $user,
            'Rejet de la modification de l\'acteur ' . $user->nom . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications rejetées. Les données restent inchangées.',
            'user' => new UserResource($user->load('role', 'service', 'modificationProposeePar', 'modificationApprouveePar'))
        ]);
    }

    public function toggleStatus(User $user): JsonResponse
    {
        // Permission de désactiver un acteur
        if (!auth()->user()->hasPermission('desactiver_acteurs')) {
            abort(403, 'Permission refusée.');
        }

        $user->update(['is_active' => !$user->is_active]);

        $action = $user->is_active ? 'user_activated' : 'user_deactivated';
        $label  = $user->is_active ? 'Activation' : 'Désactivation';

        AuditLogger::forModel($action, $user, $label . ' du compte de ' . $user->nom);

        return response()->json([
            'message'   => $user->is_active ? 'Compte activé.' : 'Ce Compte a été désactivé.',
            'is_active' => $user->is_active,
        ]);
    }

    public function assignPermissions(User $user): JsonResponse
    {
        // Seuls les administrateurs (creer_acteurs ET modifier_acteurs) peuvent gérer les permissions directes
        $isAdmin = auth()->user()->hasPermission('creer_acteurs') && auth()->user()->hasPermission('modifier_acteurs');
        if (!$isAdmin) {
            return response()->json([
                'message' => 'Seuls les administrateurs peuvent modifier les permissions des acteurs.'
            ], 403);
        }

        request()->validate([
            'permission_ids'   => ['nullable', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
            'denied_ids'       => ['nullable', 'array'],
            'denied_ids.*'     => ['exists:permissions,id'],
        ]);

        $grantedIds = collect(request('permission_ids', []));
        $deniedIds  = collect(request('denied_ids', []));

        // Une permission ne peut pas être dans les deux listes en même temps
        $deniedIds = $deniedIds->diff($grantedIds)->values();

        $user->permissionsDirectes()->sync($grantedIds->toArray());
        $user->permissionsRetirees()->sync($deniedIds->toArray());

        AuditLogger::forModel(
            'permissions_updated',
            $user,
            'Permissions mises à jour pour ' . $user->nom
        );

        return response()->json([
            'message' => 'Permissions mises à jour.',
        ]);
    }
}