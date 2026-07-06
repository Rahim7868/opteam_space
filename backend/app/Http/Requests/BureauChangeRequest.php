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
        // Récupère l'objet ou l'ID de bureau_change si on est en update
        $bureauChange = $this->route('bureau_change') ?? $this->route('bureauChange');
        $bureauChangeId = is_object($bureauChange) ? $bureauChange->id : $bureauChange;

        return [
            'numero_ordre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('bureau_changes', 'numero_ordre')
                    ->ignore($bureauChangeId),
            ],

            'designation' => ['required', 'string', 'max:255'],

            'numero_agrement' => [
                'required',
                'string',
                'max:100',
                Rule::unique('bureau_changes', 'numero_agrement')
                    ->ignore($bureauChangeId),
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
            'numero_ordre.required'      => 'Le numéro d\'ordre est obligatoire.',
            'numero_ordre.unique'        => 'Ce numéro d\'ordre existe déjà.',
            'designation.required'       => 'La désignation est obligatoire.',
            'numero_agrement.required'   => 'Le numéro d\'agrément est obligatoire.',
            'numero_agrement.unique'     => 'Ce numéro d\'agrément existe déjà.',
            'representant_legal.required'=> 'Le représentant légal est obligatoire.',
        ];
    }
}