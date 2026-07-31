<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'           => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'max:255', 'unique:users,email'],
            'adresse'       => ['required', 'string', 'max:255'],
            'fonction'      => ['required', 'string', 'max:255'],
            'role_id'       => ['required', 'exists:roles,id'],
            'agence_id'     => ['required', 'exists:agences,id'],
            'direction_id'  => ['required', 'exists:directions,id'],
            'departement_id'=> ['required', 'exists:departements,id'],
            'service_id'    => ['required', 'exists:services,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'           => 'Le nom est obligatoire.',
            'email.required'         => 'L\'email est obligatoire.',
            'email.unique'           => 'Cet email est déjà utilisé.',
            'adresse.required'       => 'L\'adresse est obligatoire.',
            'fonction.required'      => 'La fonction est obligatoire.',
            'role_id.required'       => 'Le rôle est obligatoire.',
            'role_id.exists'         => 'Le rôle sélectionné est invalide.',
            'agence_id.required'     => 'L\'agence est obligatoire.',
            'agence_id.exists'       => 'L\'agence sélectionnée est invalide.',
            'direction_id.required'  => 'La direction est obligatoire.',
            'direction_id.exists'    => 'La direction sélectionnée est invalide.',
            'departement_id.required'=> 'Le département est obligatoire.',
            'departement_id.exists'  => 'Le département sélectionné est invalide.',
            'service_id.required'    => 'Le service est obligatoire.',
            'service_id.exists'      => 'Le service sélectionné est invalide.',
        ];
    }
}