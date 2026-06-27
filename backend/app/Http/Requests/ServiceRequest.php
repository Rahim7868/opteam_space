<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'departement_id' => ['required', 'exists:departements,id'],
            'libelle'        => ['required', 'string', 'max:255'],
            'adresse'        => ['nullable', 'string', 'max:255'],
            'telephone'      => ['nullable', 'string', 'max:50'],
            'email'          => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'departement_id.required' => 'Le département est obligatoire.',
            'departement_id.exists'   => 'Le département sélectionné est invalide.',
            'libelle.required'        => 'Le libellé est obligatoire.',
            'email.email'             => 'Format email invalide.',
        ];
    }
}