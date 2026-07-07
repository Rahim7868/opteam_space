<?php

namespace App\Http\Controllers;

use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RoleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RoleResource::collection(
            Role::with('permissions')->get()
        );
    }

    public function store(): RoleResource
    {
        request()->validate([
            'libelle'          => ['required', 'string', 'unique:roles,libelle'],
            'permission_ids'   => ['nullable', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);

        $role = Role::create(['libelle' => request('libelle')]);

        if (request('permission_ids')) {
            $role->permissions()->sync(request('permission_ids'));
        }

        AuditLogger::forModel('role_created', $role, 'Création rôle : ' . $role->libelle);

        return new RoleResource($role->load('permissions'));
    }

    public function show(Role $role): RoleResource
    {
        return new RoleResource($role->load('permissions'));
    }

    public function update(Role $role): RoleResource
    {
        request()->validate([
            'libelle'          => ['required', 'string', 'unique:roles,libelle,' . $role->id],
            'permission_ids'   => ['nullable', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);

        $role->update(['libelle' => request('libelle')]);
        $role->permissions()->sync(request('permission_ids', []));

        AuditLogger::forModel('role_updated', $role, 'Modification rôle : ' . $role->libelle);

        return new RoleResource($role->load('permissions'));
    }

    public function destroy(Role $role): JsonResponse
    {
        // Vérifier qu'aucun utilisateur n'utilise ce rôle
        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : des acteurs utilisent ce rôle.'
            ], 422);
        }

        AuditLogger::forModel('role_deleted', $role, 'Suppression rôle : ' . $role->libelle);

        $role->delete();

        return response()->json(['message' => 'Rôle supprimé.']);
    }
}
