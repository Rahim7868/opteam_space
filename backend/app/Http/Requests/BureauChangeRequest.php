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
        // Récupère l'objet bureau_change si on est en update
        $bureauChange = $this->route('bureauChange');

        return [
            'designation' => ['required', 'string', 'max:255'],

            'numero_agrement' => [
                'required',
                'string',
                'max:100',
                Rule::unique('bureau_changes', 'numero_agrement')
                    ->ignore($bureauChange?->id),
            ],

            'representant_legal' => ['required', 'string', 'max:255'],
            'contact'            => ['nullable', 'string', 'max:255'],
            'adresse'            => ['nullable', 'string', 'max:255'],
            // statut et created_by/validated_by gérés dans le controller
        ];
    }

    public function messages(): array
    {
        return [
            'designation.required'       => 'La désignation est obligatoire.',
            'numero_agrement.required'   => 'Le numéro d\'agrément est obligatoire.',
            'numero_agrement.unique'     => 'Ce numéro d\'agrément existe déjà.',
            'representant_legal.required'=> 'Le représentant légal est obligatoire.',
        ];
    }
}