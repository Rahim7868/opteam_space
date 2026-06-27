<?php

namespace App\Http\Controllers;

use App\Http\Requests\FixingRequest;
use App\Http\Resources\FixingResource;
use App\Models\Fixing;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FixingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = Fixing::query()
            ->with('createur', 'validateur')
            ->latest();

        if (request('statut')) {
            $query->where('statut', request('statut'));
        }

        if (request('devise')) {
            $query->where('devise', request('devise'));
        }

        return FixingResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(FixingRequest $request): FixingResource
    {
        $fixing = Fixing::create([
            ...$request->validated(),
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

        $fixing->update($request->validated());

        AuditLogger::forModel(
            'fixing_updated',
            $fixing,
            'Modification fixing ' . $fixing->devise . ' — ' . $fixing->cours
        );

        return new FixingResource($fixing->load('createur'));
    }

    public function valider(Fixing $fixing): JsonResponse
    {
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
        request()->validate([
            'commentaire' => ['nullable', 'string'],
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
}