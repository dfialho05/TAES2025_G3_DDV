<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Registration is public
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where(function ($query) {
                    $query->whereNull('deleted_at');
                }),
            ],
            'password' => ['required', 'string', 'min:3'],
            'nickname' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                'unique:users,nickname',
            ],
            'photo_avatar_filename' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'name',
            'email' => 'email address',
            'password' => 'password',
            'nickname' => 'nickname',
            'photo_avatar_filename' => 'photo',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please provide your name.',
            'email.required' => 'Please provide an email address.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'password.required' => 'Please provide a password.',
            'password.min' => 'The password must be at least 3 characters.',
            'nickname.unique' => 'This nickname is already taken.',
            'nickname.max' => 'The nickname must not exceed 20 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace from string inputs
        if ($this->has('name')) {
            $this->merge(['name' => trim($this->input('name'))]);
        }

        if ($this->has('email')) {
            $this->merge(['email' => trim(strtolower($this->input('email')))]);
        }

        if ($this->has('nickname')) {
            $this->merge(['nickname' => trim($this->input('nickname'))]);
        }
    }
}
