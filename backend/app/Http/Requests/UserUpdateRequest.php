<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'nom'        => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255',
                             Rule::unique('users', 'email')->ignore($userId)],
            'adresse'    => ['nullable', 'string', 'max:255'],
            'service_id' => ['nullable', 'exists:services,id'],
            'role_id'    => ['nullable', 'exists:roles,id'],
            // Pas de password ici → géré séparément via change-password
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'      => 'Le nom est obligatoire.',
            'email.required'    => 'L\'email est obligatoire.',
            'email.unique'      => 'Cet email est déjà utilisé.',
            'service_id.exists' => 'Le service sélectionné est invalide.',
            'role_id.exists'    => 'Le rôle sélectionné est invalide.',
        ];
    }
}