<?php

namespace App\Http\Controllers;

use App\Http\Requests\FixingRequest;
use App\Http\Resources\FixingResource;
use App\Models\Fixing;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class FixingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = Fixing::query()
            ->with('createur', 'validateur', 'modificationProposeePar', 'modificationApprouveePar')
            ->latest();

        if (!auth()->user()->hasPermission('consulter_fixing')) {
            $query->where('created_by', auth()->id());
        }

        if (request('statut')) {
            $query->where('statut', request('statut'));
        }

        if (request('devise')) {
            $query->where('devise', request('devise'));
        }

        if (request('createur_id')) {
            $query->where('created_by', request('createur_id'));
        }

        if (request('date_debut')) {
            $query->whereDate('date_fixing', '>=', request('date_debut'));
        }
        if (request('date_fin')) {
            $query->whereDate('date_fixing', '<=', request('date_fin'));
        }

        $fixings = $query->paginate(request('per_page', 10));

        $fixings->getCollection()->transform(function ($fixing) {
            $fixing->variation = $fixing->calculateVariation();

            return $fixing;
        });

        return FixingResource::collection($fixings);
    }

    public function store(FixingRequest $request): FixingResource|JsonResponse
    {
        $data = $request->validated();

        $exists = Fixing::where('devise', $data['devise'])
            ->where('date_fixing', $data['date_fixing'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message'    => 'Un fixing pour cette devise existe déjà à cette date.',
                'error_code' => 'DUPLICATE_FIXING',
            ], 409);
        }

        if ($request->hasFile('piece_jointe')) {
            $data['piece_jointe'] = $request->file('piece_jointe')
                ->store('fixings', 'public');
        }

        $fixing = Fixing::create([
            ...$data,
            'created_by' => auth()->id(),
            'statut'     => 'en_attente',
        ]);

        AuditLogger::forModel(
            'fixing_created',
            $fixing,
            'Création fixing ' . $fixing->devise . ' — ' . $fixing->cours
        );

        return new FixingResource($fixing->load('createur'));
    }

    public function show(Fixing $fixing): FixingResource
    {
        return new FixingResource($fixing->load('createur', 'validateur'));
    }

    public function update(FixingRequest $request, Fixing $fixing): JsonResponse|FixingResource
    {
        if (!$fixing->isEditable()) {
            return response()->json([
                'message' => 'Ce fixing ne peut plus être modifié.'
            ], 403);
        }

        // Exception pour l'Admin : peut modifier les fixings des autres
        $isAdmin = auth()->user()->hasPermission('creer_acteurs') && auth()->user()->hasPermission('modifier_acteurs');

        if (!$isAdmin && $fixing->created_by !== auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres fixings.'
            ], 403);
        }

        $data = $request->validated();

        if ($request->hasFile('piece_jointe')) {
            $filePath = $request->file('piece_jointe')->store('fixings', 'public');
            $data['piece_jointe'] = $filePath;
            $data['piece_jointe_url'] = Storage::disk('public')->url($filePath);
        }

        $fixing->update([
            'statut_modification' => 'en_attente_validation_modification',
            'modification_proposee' => $data,
            'modification_proposee_par' => auth()->id(),
            'modification_approuvee_par' => null,
            'modification_approuvee_at' => null,
        ]);

        AuditLogger::forModel(
            'fixing_modification_proposee',
            $fixing,
            'Proposition de modification du fixing ' . $fixing->devise . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications proposées. En attente de validation.',
            'fixing' => new FixingResource($fixing->load('createur'))
        ]);
    }

    public function approuverModification(Fixing $fixing): JsonResponse
    {
        if (!auth()->user()->hasPermission('approuver_modification_fixing')) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission d\'approuver les modifications.'
            ], 403);
        }

        if (!$fixing->modification_proposee || $fixing->statut_modification !== 'en_attente_validation_modification') {
            return response()->json([
                'message' => 'Aucune modification en attente pour cet élément.'
            ], 422);
        }

        // Empêcher l'auto-approbation
        if (auth()->id() === $fixing->modification_proposee_par) {
            return response()->json([
                'message' => 'Vous ne pouvez pas approuver vos propres modifications.'
            ], 403);
        }

        $newStatut = $fixing->statut === 'rejete' ? 'en_attente' : $fixing->statut;

        $fixing->update([
            ...$fixing->modification_proposee,
            'statut' => $newStatut,
            'statut_modification' => null,
            'modification_proposee' => null,
            'modification_proposee_par' => null,
            'modification_approuvee_par' => auth()->id(),
            'modification_approuvee_at' => now(),
        ]);

        AuditLogger::forModel(
            'fixing_modification_approuvee',
            $fixing,
            'Approbation de la modification du fixing ' . $fixing->devise . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications appliquées définitivement.',
            'fixing' => new FixingResource($fixing->load('createur', 'validateur'))
        ]);
    }

    public function valider(Fixing $fixing): JsonResponse
    {
        if (!auth()->user()->hasPermission('valider_fixing')) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        if (!$fixing->isEditable()) {
            return response()->json(['message' => 'Déjà traité.'], 403);
        }

        $fixing->update([
            'statut'       => 'valide',
            'validated_by' => auth()->id(),
        ]);

        AuditLogger::forModel(
            'fixing_valide',
            $fixing,
            'Validation du fixing ' . $fixing->devise . ' — ' . $fixing->cours
        );

        return response()->json([
            'message' => 'Fixing validé.',
            'fixing'  => new FixingResource($fixing->load('createur', 'validateur')),
        ]);
    }

    public function rejeter(Fixing $fixing): JsonResponse
    {
        if (!auth()->user()->hasPermission('rejeter_fixing')) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        request()->validate([
            'commentaire' => ['required', 'string', 'min:3'],
        ], [
            'commentaire.required' => 'Le motif du rejet est obligatoire.',
            'commentaire.min' => 'Le motif doit contenir au moins 3 caractères.',
        ]);

        if (!$fixing->isEditable()) {
            return response()->json(['message' => 'Déjà traité.'], 403);
        }

        $fixing->update([
            'statut'       => 'rejete',
            'validated_by' => auth()->id(),
            'commentaire'  => request('commentaire'),
        ]);

        AuditLogger::forModel(
            'fixing_rejete',
            $fixing,
            'Rejet du fixing ' . $fixing->devise . ' — ' . $fixing->cours
        );

        return response()->json([
            'message' => 'Fixing rejeté.',
            'fixing'  => new FixingResource($fixing->load('createur', 'validateur')),
        ]);
    }

    public function rejeterModification(Fixing $fixing): JsonResponse
    {
        if (!auth()->user()->hasPermission('approuver_modification_fixing')) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission de gérer les modifications.'
            ], 403);
        }

        if (!$fixing->modification_proposee || $fixing->statut_modification !== 'en_attente_validation_modification') {
            return response()->json([
                'message' => 'Aucune modification en attente pour cet élément.'
            ], 422);
        }

        $fixing->update([
            'statut_modification' => null,
            'modification_proposee' => null,
            'modification_proposee_par' => null,
            'modification_approuvee_par' => auth()->id(),
            'modification_approuvee_at' => now(),
        ]);

        AuditLogger::forModel(
            'fixing_modification_rejetee',
            $fixing,
            'Rejet de la modification du fixing ' . $fixing->devise . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications rejetées. Les données restent inchangées.',
            'fixing' => new FixingResource($fixing->load('createur', 'validateur'))
        ]);
    }
}