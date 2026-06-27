<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AgenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $agence = $this->route('agence');

        return [
            'libelle' => [
                'required',
                'string',
                'max:255',
                Rule::unique('agences', 'libelle')->ignore($agence?->id),
            ],
            'adresse'   => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'email'     => ['nullable', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'libelle.required' => 'Le libellé est obligatoire.',
            'libelle.unique'   => 'Une agence avec ce libellé existe déjà.',
            'email.email'      => 'Format email invalide.',
        ];
    }
}