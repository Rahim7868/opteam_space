<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont invalides.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Ce compte est inactif.'],
            ]);
        }

        $token = $user->createToken('opteam-space')->plainTextToken;

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'description' => 'Connexion utilisateur',
        ]);

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load('bureauChange')),
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('bureauChange'));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Deconnexion effectuee.']);
    }
}
