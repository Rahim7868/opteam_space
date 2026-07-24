<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BureauChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $bureauChange = $this->route('bureauChange');

        return [
            'numero_ordre'       => ['nullable', 'string', 'max:50'],
            'designation'        => ['required', 'string', 'max:255'],
            'numero_agrement'    => [
                'required',
                'string',
                'max:100',
                Rule::unique('bureau_changes', 'numero_agrement')
                    ->ignore($bureauChange?->id),
            ],
            'representant_legal' => ['required', 'string', 'max:255'],
            'contact'            => ['required', 'string', 'regex:/^[0-9]{9}$/'],
            'adresse'            => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'designation.required'        => 'La désignation est obligatoire.',
            'numero_agrement.required'    => 'Le numéro d\'agrément est obligatoire.',
            'numero_agrement.unique'      => 'Ce numéro d\'agrément existe déjà.',
            'representant_legal.required' => 'Le représentant légal est obligatoire.',
            'contact.required'            => 'Le numéro de contact est obligatoire.',
            'contact.regex'               => 'Le numéro de contact doit être composé de 9 chiffres exacts et sans espaces (ex: 622111111).',
        ];
    }
}