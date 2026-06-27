<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DirectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agence_id' => ['required', 'exists:agences,id'],
            'libelle'   => ['required', 'string', 'max:255'],
            'adresse'   => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'email'     => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'agence_id.required' => 'L\'agence est obligatoire.',
            'agence_id.exists'   => 'L\'agence sélectionnée est invalide.',
            'libelle.required'   => 'Le libellé est obligatoire.',
            'email.email'        => 'Format email invalide.',
        ];
    }
}