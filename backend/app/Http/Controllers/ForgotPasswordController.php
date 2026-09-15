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
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Veuillez fournir une adresse email valide.'
            ], 422);
        }

        // Message générique pour empêcher l'énumération d'utilisateurs
        $genericMessage = 'Si cette adresse email existe dans notre système, un lien de réinitialisation vous a été envoyé.';

        $response = Password::sendResetLink($request->only('email'));

        if ($response == Password::RESET_THROTTLED) {
            return response()->json([
                'message' => 'Veuillez patienter avant de demander un autre lien.'
            ], 429);
        }

        // Toujours retourner un succès pour ne pas révéler si l'email existe
        return response()->json([
            'message' => $genericMessage
        ]);
    }

    /**
     * Réinitialiser le mot de passe.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
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