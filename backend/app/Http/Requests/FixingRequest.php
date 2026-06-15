<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FixingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'date_fixing' => ['required', 'date'],
            'devise' => ['required', 'string', 'max:10'],
            'cours' => ['required', 'numeric', 'min:0'],
            'piece_jointe' => ['sometimes', 'nullable', 'file', 'max:4096'],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}