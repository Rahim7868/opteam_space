<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = User::query()
            ->with('role', 'service')
            ->latest();

        if (request('search')) {
            $search = request('search');
            $query->where(fn($q) => $q
                ->where('nom', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
            );
        }

        if (request('role_id')) {
            $query->where('role_id', request('role_id'));
        }

        if (request()->has('is_active')) {
            $query->where('is_active', request('is_active'));
        }

        return UserResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(UserStoreRequest $request): UserResource
    {
        $user = User::create([
            ...$request->validated(),
            'password'             => Hash::make('00000000'),
            'must_change_password' => true,
            'is_active'            => true,
        ]);

        AuditLogger::forModel(
            'user_created',
            $user,
            'Création de l\'acteur ' . $user->nom
        );

        return new UserResource($user->load('role', 'service'));
    }

    public function show(User $user): UserResource
    {
        return new UserResource(
            $user->load('role', 'service', 'permissionsDirectes', 'permissionsRetirees')
        );
    }

    public function update(UserUpdateRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        AuditLogger::forModel(
            'user_updated',
            $user,
            'Modification de l\'acteur ' . $user->nom
        );

        return new UserResource($user->load('role', 'service'));
    }

    public function toggleStatus(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);

        $action = $user->is_active ? 'user_activated' : 'user_deactivated';
        $label  = $user->is_active ? 'Activation' : 'Désactivation';

        AuditLogger::forModel(
            $action,
            $user,
            $label . ' du compte de ' . $user->nom
        );

        return response()->json([
            'message'   => $user->is_active ? 'Compte activé.' : 'Compte désactivé.',
            'is_active' => $user->is_active,
        ]);
    }

    public function assignPermissions(User $user): JsonResponse
    {
        request()->validate([
            'permission_ids'   => ['nullable', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
            'denied_ids'       => ['nullable', 'array'],
            'denied_ids.*'     => ['exists:permissions,id'],
        ]);

        $grantedIds = collect(request('permission_ids', []));
        $deniedIds  = collect(request('denied_ids', []));

        // Une permission ne peut pas être dans les deux listes en même temps
        // En cas de conflit, la liste "directes" l'emporte (on la retire des refus)
        $deniedIds = $deniedIds->diff($grantedIds)->values();

        $user->permissionsDirectes()->sync($grantedIds->toArray());
        $user->permissionsRetirees()->sync($deniedIds->toArray());

        AuditLogger::forModel(
            'permissions_updated',
            $user,
            'Permissions mises à jour pour ' . $user->nom
        );

        return response()->json([
            'message' => 'Permissions mises à jour.',
        ]);
    }
}