<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed', // exige new_password_confirmation
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'new_password.required'  => 'Le nouveau mot de passe est obligatoire.',
            'new_password.min'       => 'Le mot de passe doit contenir au moins 8 caractères.',
            'new_password.confirmed' => 'La confirmation ne correspond pas.',
        ];
    }
}