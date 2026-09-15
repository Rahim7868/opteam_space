<?php

namespace App\Http\Controllers;

use App\Http\Resources\PermissionResource;
use App\Models\Permission;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PermissionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        if (!auth()->user()->hasPermission('gerer_permissions')) {
            abort(403, 'Permission refusée.');
        }

        return PermissionResource::collection(
            Permission::all()
        );
    }

    public function store(): PermissionResource
    {
        if (!auth()->user()->hasPermission('gerer_permissions')) {
            abort(403, 'Permission refusée.');
        }

        request()->validate([
            'libelle' => ['required', 'string', 'unique:permissions,libelle'],
        ]);

        $permission = Permission::create(['libelle' => request('libelle')]);

        AuditLogger::forModel('permission_created', $permission, 'Création permission : ' . $permission->libelle);

        return new PermissionResource($permission);
    }

    public function show(Permission $permission): PermissionResource
    {
        if (!auth()->user()->hasPermission('gerer_permissions')) {
            abort(403, 'Permission refusée.');
        }

        return new PermissionResource($permission);
    }

    public function update(Permission $permission): PermissionResource
    {
        if (!auth()->user()->hasPermission('gerer_permissions')) {
            abort(403, 'Permission refusée.');
        }

        request()->validate([
            'libelle' => ['required', 'string', 'unique:permissions,libelle,' . $permission->id],
        ]);

        $permission->update(['libelle' => request('libelle')]);

        AuditLogger::forModel('permission_updated', $permission, 'Modification permission : ' . $permission->libelle);

        return new PermissionResource($permission);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        if (!auth()->user()->hasPermission('gerer_permissions')) {
            abort(403, 'Permission refusée.');
        }

        AuditLogger::forModel('permission_deleted', $permission, 'Suppression permission : ' . $permission->libelle);

        $permission->delete();

        return response()->json(['message' => 'Permission supprimée.']);
    }
}
