<?php

namespace App\Http\Controllers;

use App\Http\Requests\DirectionRequest;
use App\Http\Resources\DirectionResource;
use App\Models\Direction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DirectionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = Direction::query()
            ->with('agence')
            ->latest();

        if (request('search')) {
            $query->where('libelle', 'like', '%' . request('search') . '%');
        }

        if (request('agence_id')) {
            $query->where('agence_id', request('agence_id'));
        }

        return DirectionResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(DirectionRequest $request): DirectionResource
    {
        $direction = Direction::create($request->validated());

        return new DirectionResource($direction->load('agence'));
    }

    public function show(Direction $direction): DirectionResource
    {
        return new DirectionResource($direction->load('agence', 'departements'));
    }

    public function update(DirectionRequest $request, Direction $direction): DirectionResource
    {
        $direction->update($request->validated());

        return new DirectionResource($direction->load('agence'));
    }

    public function destroy(Direction $direction): JsonResponse
    {
        if ($direction->departements()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : des départements sont rattachés à cette direction.'
            ], 422);
        }

        $direction->delete();

        return response()->json(['message' => 'Direction supprimée.']);
    }
}