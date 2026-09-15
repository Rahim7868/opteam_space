<?php

namespace App\Http\Controllers;

use App\Http\Requests\BureauChangeRequest;
use App\Http\Resources\BureauChangeResource;
use App\Imports\BureauChangesImport;
use App\Models\BureauChange;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class BureauChangeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = BureauChange::query()
            ->with('createur', 'validateur', 'modificationProposeePar', 'modificationApprouveePar')
            ->latest();

        if (!auth()->user()->hasPermission('consulter_bureau_change')) {
            $query->where('created_by', auth()->id());
        }

        if (request('search')) {
            $search = request('search');
            $query->where(fn($q) => $q
                ->where('numero_ordre', 'like', "%{$search}%")
                ->orWhere('designation', 'like', "%{$search}%")
                ->orWhere('numero_agrement', 'like', "%{$search}%")
                ->orWhere('adresse', 'like', "%{$search}%")
            );
        }

        if (request('statut')) {
            $query->where('statut', request('statut'));
        }

        if (request('createur_id')) {
            $query->where('created_by', request('createur_id'));
        }

        if (request('date_debut')) {
            $query->whereDate('created_at', '>=', request('date_debut'));
        }

        if (request('date_fin')) {
            $query->whereDate('created_at', '<=', request('date_fin'));
        }

        return BureauChangeResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(BureauChangeRequest $request): BureauChangeResource
    {
        $bureauChange = BureauChange::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
            'statut'     => 'en_attente',
        ]);

        AuditLogger::forModel(
            'bureau_created',
            $bureauChange,
            'Création bureau de change : ' . $bureauChange->designation
        );

        return new BureauChangeResource($bureauChange->load('createur'));
    }

    public function show(BureauChange $bureauChange): BureauChangeResource
    {
        return new BureauChangeResource(
            $bureauChange->load('createur', 'validateur')
        );
    }

    public function update(BureauChangeRequest $request, BureauChange $bureauChange): JsonResponse|BureauChangeResource
    {
        if (!$bureauChange->isEditable()) {
            return response()->json([
                'message' => 'Ce bureau de change ne peut plus être modifié.'
            ], 403);
        }

        // Exception pour l'Admin : peut modifier les bureaux des autres
        $isAdmin = auth()->user()->hasPermission('creer_acteurs') && auth()->user()->hasPermission('modifier_acteurs');

        if (!$isAdmin && $bureauChange->created_by !== auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres bureaux de change.'
            ], 403);
        }

        $data = $request->validated();

        if ($request->hasFile('piece_jointe')) {
            $filePath = $request->file('piece_jointe')->store('bureau_changes', 'public');
            $data['piece_jointe'] = $filePath;
            $data['piece_jointe_url'] = Storage::disk('public')->url($filePath);
        }

        $bureauChange->update([
            'statut_modification' => 'en_attente_validation_modification',
            'modification_proposee' => $data,
            'modification_proposee_par' => auth()->id(),
            'modification_approuvee_par' => null,
            'modification_approuvee_at' => null,
        ]);

        AuditLogger::forModel(
            'bureau_modification_proposee',
            $bureauChange,
            'Proposition de modification du bureau de change ' . $bureauChange->designation . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications proposées. En attente de validation.',
            'bureauChange' => new BureauChangeResource($bureauChange->load('createur'))
        ]);
    }

    public function approuverModification(BureauChange $bureauChange): JsonResponse
    {
        if (!auth()->user()->hasPermission('approuver_modification_bureau')) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission d\'approuver les modifications.'
            ], 403);
        }

        if (!$bureauChange->modification_proposee || $bureauChange->statut_modification !== 'en_attente_validation_modification') {
            return response()->json([
                'message' => 'Aucune modification en attente pour cet élément.'
            ], 422);
        }

        $newStatut = $bureauChange->statut === 'rejete' ? 'en_attente' : $bureauChange->statut;

        $bureauChange->update([
            ...$bureauChange->modification_proposee,
            'statut' => $newStatut,
            'statut_modification' => null,
            'modification_proposee' => null,
            'modification_proposee_par' => null,
            'modification_approuvee_par' => auth()->id(),
            'modification_approuvee_at' => now(),
        ]);

        AuditLogger::forModel(
            'bureau_modification_approuvee',
            $bureauChange,
            'Approbation de la modification du bureau de change ' . $bureauChange->designation . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications appliquées définitivement.',
            'bureauChange' => new BureauChangeResource($bureauChange->load('createur', 'validateur'))
        ]);
    }

    public function import(): JsonResponse
    {
        request()->validate([
            'fichier' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        $import = new BureauChangesImport(auth()->id());

        try {
            Excel::import($import, request()->file('fichier'));
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = collect($e->failures())->map(fn($f) =>
                "Ligne {$f->row()} : " . implode(', ', $f->errors())
            )->toArray();

            return response()->json([
                'message'  => 'Le fichier contient des erreurs de validation.',
                'imported' => 0,
                'skipped'  => count($failures),
                'errors'   => $failures,
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la lecture du fichier : ' . $e->getMessage(),
            ], 422);
        }

        AuditLogger::log(
            'bureau_import',
            'BureauChange',
            null,
            'Import Excel : ' . $import->imported . ' importés, ' . $import->skipped . ' ignorés'
        );

        return response()->json([
            'message'  => "{$import->imported} bureau(x) importé(s) avec succès.",
            'imported' => $import->imported,
            'skipped'  => $import->skipped,
            'errors'   => $import->errors,
        ]);
    }

    public function valider(BureauChange $bureauChange): JsonResponse
    {
        if (!auth()->user()->hasPermission('valider_bureau_change')) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        if (!$bureauChange->isEditable()) {
            return response()->json(['message' => 'Déjà traité.'], 403);
        }

        $bureauChange->update([
            'statut'       => 'valide',
            'validated_by' => auth()->id(),
        ]);

        AuditLogger::forModel(
            'bureau_valide',
            $bureauChange,
            'Validation bureau de change : ' . $bureauChange->designation
        );

        return response()->json([
            'message'      => 'Bureau de change validé.',
            'bureauChange' => new BureauChangeResource(
                $bureauChange->load('createur', 'validateur')
            ),
        ]);
    }

    public function rejeter(BureauChange $bureauChange): JsonResponse
    {
        if (!auth()->user()->hasPermission('valider_bureau_change')) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        request()->validate([
            'commentaire' => ['required', 'string', 'min:3'],
        ], [
            'commentaire.required' => 'Le motif du rejet est obligatoire.',
            'commentaire.min' => 'Le motif doit contenir au moins 3 caractères.',
        ]);

        if (!$bureauChange->isEditable()) {
            return response()->json(['message' => 'Déjà traité.'], 403);
        }

        $bureauChange->update([
            'statut'       => 'rejete',
            'validated_by' => auth()->id(),
            'commentaire'  => request('commentaire'),
        ]);

        AuditLogger::forModel(
            'bureau_rejete',
            $bureauChange,
            'Rejet bureau de change : ' . $bureauChange->designation
        );

        return response()->json([
            'message'      => 'Bureau de change rejeté.',
            'bureauChange' => new BureauChangeResource(
                $bureauChange->load('createur', 'validateur')
            ),
        ]);
    }

    public function rejeterModification(BureauChange $bureauChange): JsonResponse
    {
        if (!auth()->user()->hasPermission('approuver_modification_bureau')) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission de gérer les modifications.'
            ], 403);
        }

        if (!$bureauChange->modification_proposee || $bureauChange->statut_modification !== 'en_attente_validation_modification') {
            return response()->json([
                'message' => 'Aucune modification en attente pour cet élément.'
            ], 422);
        }

        $bureauChange->update([
            'statut_modification' => null,
            'modification_proposee' => null,
            'modification_proposee_par' => null,
            'modification_approuvee_par' => auth()->id(),
            'modification_approuvee_at' => now(),
        ]);

        AuditLogger::forModel(
            'bureau_modification_rejetee',
            $bureauChange,
            'Rejet de la modification du bureau de change ' . $bureauChange->designation . ' par ' . auth()->user()->nom
        );

        return response()->json([
            'message' => 'Modifications rejetées. Les données restent inchangées.',
            'bureauChange' => new BureauChangeResource($bureauChange->load('createur', 'validateur'))
        ]);
    }
}