<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    private const MAX_FAILED_LOGIN_ATTEMPTS = 3;
    private const FAILED_LOGIN_DEACTIVATION_REASON = 'Compte désactivé automatiquement après 3 tentatives de connexion échouées.';
    private const FAILED_LOGIN_MESSAGE = 'Trop de tentatives de connexion échouées. Veuillez contacter l’administrateur.';

    public function login(LoginRequest $request): JsonResponse
    {
        $userId = User::where('email', $request->email)->value('id');

        if (!$userId) {
            return $this->loginFailure('Les identifiants sont invalides.');
        }

        $result = DB::transaction(function () use ($userId, $request) {
            $user = User::query()->lockForUpdate()->findOrFail($userId);

            if (!$user->is_active) {
                return ['status' => 'inactive'];
            }

            if (!Hash::check($request->password, $user->password)) {
                $user->failed_login_attempts++;

                if ($user->failed_login_attempts >= self::MAX_FAILED_LOGIN_ATTEMPTS) {
                    $user->update([
                        'is_active' => false,
                        'motif_desactivation' => self::FAILED_LOGIN_DEACTIVATION_REASON,
                        'desactive_par' => null,
                        'desactive_le' => now(),
                    ]);
                    $user->tokens()->delete();

                    AuditLogger::log(
                        'user_deactivated',
                        'User',
                        $user->id,
                        'Désactivation automatique du compte de ' . $user->nom . ' (Motif : ' . self::FAILED_LOGIN_DEACTIVATION_REASON . ')'
                    );

                    return ['status' => 'deactivated'];
                }

                $user->save();

                return ['status' => 'invalid'];
            }

            if ($user->failed_login_attempts > 0) {
                $user->update(['failed_login_attempts' => 0]);
            }

            return ['status' => 'authenticated', 'user' => $user];
        });

        if ($result['status'] === 'invalid') {
            return $this->loginFailure('Les identifiants sont invalides.');
        }

        if ($result['status'] === 'deactivated') {
            return $this->loginFailure(self::FAILED_LOGIN_MESSAGE);
        }

        if ($result['status'] === 'inactive') {
            return $this->loginFailure('Ce compte est désactivé. Contactez un administrateur.');
        }

        $user = $result['user']->load(['role.permissions', 'service', 'permissionsDirectes', 'permissionsRetirees']);

        // Récupérer le paramètre "remember"
        $remember = $request->boolean('remember', false);

        // Si "Se souvenir de moi" est coché, on prolonge la session (30 jours)
        if ($remember) {
            $token = $user->createToken('app-token', ['*'], now()->addDays(30))->plainTextToken;
        } else {
            $token = $user->createToken('app-token')->plainTextToken;
        }

        AuditLogger::logForUser(
            $user->id,
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

    private function loginFailure(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => ['email' => [$message]],
        ], 422);
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
            'failed_login_attempts' => 0,
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
            $request->user()->load('role', 'service', 'permissionsDirectes', 'permissionsRetirees')
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