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
            ->with('createur', 'validateur')
            ->latest();

        if (request('statut')) {
            $query->where('statut', request('statut'));
        }

        if (request('devise')) {
            $query->where('devise', request('devise'));
        }

        $fixings = $query->paginate(request('per_page', 10));

        // Calculer la variation dynamiquement sans colonne en base
        $fixings->getCollection()->transform(function ($fixing) {
            $precedent = Fixing::where('devise', $fixing->devise)
                ->where(function ($query) use ($fixing) {
                    $query->where('date_fixing', '<', $fixing->date_fixing)
                        ->orWhere(function ($q) use ($fixing) {
                            $q->where('date_fixing', $fixing->date_fixing)
                              ->where('id', '<', $fixing->id);
                        });
                })
                ->orderBy('date_fixing', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $fixing->variation = $precedent
                ? round((float) $fixing->cours - (float) $precedent->cours, 6)
                : null;

            return $fixing;
        });

        return FixingResource::collection($fixings);
    }

    public function store(FixingRequest $request): FixingResource
    {
        $data = $request->validated();

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

        // Vérifier que c'est bien son fixing
        if ($fixing->created_by !== auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que vos propres fixings.'
            ], 403);
        }

        $data = $request->validated();

        if ($request->hasFile('piece_jointe')) {
            if ($fixing->piece_jointe) {
                Storage::disk('public')->delete($fixing->piece_jointe);
            }
            $data['piece_jointe'] = $request->file('piece_jointe')
                ->store('fixings', 'public');
        }

        $fixing->update($data);

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
        if (!$fixing->isEditable()) {
            return response()->json(['message' => 'Déjà traité.'], 403);
        }

        $fixing->update([
            'statut'       => 'rejete',
            'validated_by' => auth()->id(),
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
