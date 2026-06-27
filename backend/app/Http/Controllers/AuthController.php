<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont invalides.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte est désactivé. Contactez un administrateur.'],
            ]);
        }

        $token = $user->createToken('app-token')->plainTextToken;

        AuditLogger::log(
            'login',
            'User',
            $user->id,
            'Connexion de ' . $user->nom
        );

        return response()->json([
            'token'                => $token,
            'must_change_password' => $user->must_change_password,
            'user'                 => new UserResource($user->load('role', 'service')),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->must_change_password) {
            return response()->json([
                'message' => 'Mot de passe déjà configuré.'
            ], 403);
        }

        $user->update([
            'password'             => Hash::make($request->new_password),
            'must_change_password' => false,
        ]);

        AuditLogger::log(
            'password_changed',
            'User',
            $user->id,
            $user->nom . ' a changé son mot de passe'
        );

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès.',
            'user'    => new UserResource($user->load('role', 'service')),
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource(
            $request->user()->load('role', 'service', 'permissionsDirectes')
        );
    }

    public function logout(Request $request): JsonResponse
    {
        AuditLogger::log(
            'logout',
            'User',
            $request->user()->id,
            'Déconnexion de ' . $request->user()->nom
        );

        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnexion effectuée.']);
    }
}