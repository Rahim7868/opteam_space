<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartementRequest;
use App\Http\Resources\DepartementResource;
use App\Models\Departement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DepartementController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = Departement::query()
            ->with('direction.agence')
            ->latest();

        if (request('search')) {
            $query->where('libelle', 'like', '%' . request('search') . '%');
        }

        if (request('direction_id')) {
            $query->where('direction_id', request('direction_id'));
        }

        return DepartementResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(DepartementRequest $request): DepartementResource
    {
        $departement = Departement::create($request->validated());

        return new DepartementResource($departement->load('direction.agence'));
    }

    public function show(Departement $departement): DepartementResource
    {
        return new DepartementResource(
            $departement->load('direction.agence', 'services')
        );
    }

    public function update(DepartementRequest $request, Departement $departement): DepartementResource
    {
        $departement->update($request->validated());

        return new DepartementResource($departement->load('direction.agence'));
    }

    public function destroy(Departement $departement): JsonResponse
    {
        if ($departement->services()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : des services sont rattachés à ce département.'
            ], 422);
        }

        $departement->delete();

        return response()->json(['message' => 'Département supprimé.']);
    }
}