<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Mot de passe actuel incorrect.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($data['new_password']),
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès.',
        ]);
    }
}
