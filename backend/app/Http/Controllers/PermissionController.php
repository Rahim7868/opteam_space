<?php

namespace App\Http\Controllers;

use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PermissionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PermissionResource::collection(
            Permission::all()
        );
    }

    public function store(): PermissionResource
    {
        request()->validate([
            'libelle' => ['required', 'string', 'unique:permissions,libelle'],
        ]);

        $permission = Permission::create(['libelle' => request('libelle')]);

        return new PermissionResource($permission);
    }

    public function show(Permission $permission): PermissionResource
    {
        return new PermissionResource($permission);
    }

    public function update(Permission $permission): PermissionResource
    {
        request()->validate([
            'libelle' => ['required', 'string', 'unique:permissions,libelle,' . $permission->id],
        ]);

        $permission->update(['libelle' => request('libelle')]);

        return new PermissionResource($permission);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $permission->delete();

        return response()->json(['message' => 'Permission supprimée.']);
    }
}