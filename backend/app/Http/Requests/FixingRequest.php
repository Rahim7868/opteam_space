<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FixingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_fixing'  => ['required', 'date'],
            'devise'       => ['required', 'string', 'max:10'],
            'cours'        => ['required', 'numeric', 'min:0'],
            'piece_jointe' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:4096'],
            // created_by → injecté automatiquement dans le controller
            // statut     → toujours 'en_attente' à la création
        ];
    }

    public function messages(): array
    {
        return [
            'date_fixing.required' => 'La date est obligatoire.',
            'devise.required'      => 'La devise est obligatoire.',
            'cours.required'       => 'Le cours est obligatoire.',
            'cours.numeric'        => 'Le cours doit être un nombre.',
            'piece_jointe.mimes'   => 'Fichier accepté : PDF, JPG, PNG.',
            'piece_jointe.max'     => 'Le fichier ne doit pas dépasser 4 Mo.',
        ];
    }
}