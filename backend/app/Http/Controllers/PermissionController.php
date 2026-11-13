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
            Permission::query()
                ->orderByRaw("
                    CASE
                        WHEN LOWER(libelle) LIKE '%fixing%' THEN 0
                        WHEN LOWER(libelle) LIKE '%bureau%' THEN 1
                        WHEN LOWER(libelle) LIKE '%acteur%'
                            OR LOWER(libelle) LIKE '%utilisateur%'
                            OR LOWER(libelle) LIKE '%user%' THEN 2
                        WHEN LOWER(libelle) LIKE '%role%'
                            OR LOWER(libelle) LIKE '%permission%' THEN 3
                        WHEN LOWER(libelle) LIKE '%agence%'
                            OR LOWER(libelle) LIKE '%direction%'
                            OR LOWER(libelle) LIKE '%departement%'
                            OR LOWER(libelle) LIKE '%service%'
                            OR LOWER(libelle) LIKE '%local%' THEN 4
                        WHEN LOWER(libelle) LIKE '%audit%'
                            OR LOWER(libelle) LIKE '%log%' THEN 5
                        ELSE 6
                    END
                ")
                ->orderByRaw('LOWER(libelle) ASC')
                ->orderBy('libelle')
                ->get()
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

        if (
            $permission->users()->exists()
            || $permission->roles()->whereHas('users')->exists()
        ) {
            return response()->json([
                'message' => 'Impossible de supprimer : cette permission est attribuée directement à un utilisateur ou via le rôle d\'un utilisateur.',
            ], 422);
        }

        AuditLogger::forModel('permission_deleted', $permission, 'Suppression permission : ' . $permission->libelle);

        $permission->delete();

        return response()->json(['message' => 'Permission supprimée.']);
    }
}
