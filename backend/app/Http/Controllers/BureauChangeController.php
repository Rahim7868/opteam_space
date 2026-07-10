<?php

namespace App\Http\Controllers;

use App\Http\Requests\BureauChangeRequest;
use App\Http\Resources\BureauChangeResource;
use App\Imports\BureauChangesImport;
use App\Models\BureauChange;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Maatwebsite\Excel\Facades\Excel;

class BureauChangeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = BureauChange::query()
            ->with('createur', 'validateur')
            ->latest();

        if (request('search')) {
            $search = request('search');
            $query->where(fn($q) => $q
                ->where('numero_ordre', 'like', "%{$search}%")
                ->orWhere('designation', 'like', "%{$search}%")
                ->orWhere('numero_agrement', 'like', "%{$search}%")
            );
        }

        if (request('statut')) {
            $query->where('statut', request('statut'));
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

        if ($bureauChange->created_by !== auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres bureaux de change.'
            ], 403);
        }

        $bureauChange->update($request->validated());

        AuditLogger::forModel(
            'bureau_updated',
            $bureauChange,
            'Modification bureau de change : ' . $bureauChange->designation
        );

        return new BureauChangeResource($bureauChange->load('createur'));
    }

    // ✅ Nouvelle méthode import
    public function import(): JsonResponse
    {
        request()->validate([
            'fichier' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120'],
        ]);

        $import = new BureauChangesImport(auth()->id());

        Excel::import($import, request()->file('fichier'));

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
        request()->validate([
            'commentaire' => ['nullable', 'string'],
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
}