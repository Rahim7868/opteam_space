<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DepartementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'direction_id' => ['required', 'exists:directions,id'],
            'libelle'      => ['required', 'string', 'max:255'],
            'adresse'      => ['nullable', 'string', 'max:255'],
            'telephone'    => ['nullable', 'string', 'max:50'],
            'email'        => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'direction_id.required' => 'La direction est obligatoire.',
            'direction_id.exists'   => 'La direction sélectionnée est invalide.',
            'libelle.required'      => 'Le libellé est obligatoire.',
            'email.email'           => 'Format email invalide.',
        ];
    }
}