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
        $bureauChange = $this->route('bureau_change') ?? $this->route('bureauChange');

        return [
            'numero_ordre' => [
                'required',
                'string',
                'max:255',
                Rule::unique('bureau_changes', 'numero_ordre')->ignore($bureauChange?->numero_ordre, 'numero_ordre'),
            ],
            'designation' => ['required', 'string', 'max:255'],
            'numero_agrement' => [
                'required',
                'string',
                'max:100',
                Rule::unique('bureau_changes', 'numero_agrement')->ignore($bureauChange?->numero_ordre, 'numero_ordre'),
            ],
            'representant_legal' => ['required', 'string', 'max:255'],
            'contact' => ['required', 'string', 'max:255'],
            'addresse' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }
}
