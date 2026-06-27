<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgenceRequest;
use App\Http\Resources\AgenceResource;
use App\Models\Agence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AgenceController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = Agence::query()->latest();

        if (request('search')) {
            $query->where('libelle', 'like', '%' . request('search') . '%');
        }

        return AgenceResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(AgenceRequest $request): AgenceResource
    {
        $agence = Agence::create($request->validated());

        return new AgenceResource($agence);
    }

    public function show(Agence $agence): AgenceResource
    {
        return new AgenceResource($agence->load('directions'));
    }

    public function update(AgenceRequest $request, Agence $agence): AgenceResource
    {
        $agence->update($request->validated());

        return new AgenceResource($agence);
    }

    public function destroy(Agence $agence): JsonResponse
    {
        if ($agence->directions()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : des directions sont rattachées à cette agence.'
            ], 422);
        }

        $agence->delete();

        return response()->json(['message' => 'Agence supprimée.']);
    }
}