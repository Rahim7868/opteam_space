<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $agent = $this->route('agent');
        $passwordRule = $this->isMethod('post') ? ['required', 'string', 'min:8'] : ['nullable', 'string', 'min:8'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($agent?->id)],
            'password' => $passwordRule,
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ];
    }
}
