<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class ForgotPasswordController extends Controller
{
    /**
     * Envoyer un lien de réinitialisation par email.
     */
    public function sendResetLinkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Email non trouvé dans notre système'
            ], 422);
        }

        $response = Password::sendResetLink($request->only('email'));

        if ($response == Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Un lien de réinitialisation vous a été envoyé par email.'
            ]);
        }

        if ($response == Password::RESET_THROTTLED) {
            return response()->json([
                'message' => 'Veuillez patienter avant de demander un autre lien.'
            ], 429);
        }

        return response()->json([
            'message' => 'Une erreur est survenue. Veuillez réessayer.'
        ], 500);
    }

    /**
     * Réinitialiser le mot de passe.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email|exists:users,email',
            'token'    => 'required',
            'password' => 'required|min:8|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $response = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                // Le modèle User utilise le cast 'hashed' sur password,
                // donc on assigne directement sans bcrypt() pour éviter le double hashage
                $user->password = $password;
                $user->must_change_password = false;
                $user->save();
            }
        );

        if ($response == Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Votre mot de passe a été réinitialisé avec succès.'
            ]);
        }

        return response()->json([
            'message' => 'Token invalide ou expiré.'
        ], 400);
    }
}