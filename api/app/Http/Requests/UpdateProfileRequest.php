<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Auth middleware should ensure the user is authenticated.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * - email and nickname uniqueness ignore the authenticated user's id
     * - if password is being changed, client should supply current_password
     */
    public function rules(): array
    {
        $userId = $this->user()?->id ?? null;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'nickname' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'nickname')->ignore($userId),
            ],
            // password change is optional; if provided it must meet min length
            'password' => ['sometimes', 'nullable', 'string', 'min:3'],
            // if changing password, require current_password to be present (controller will verify)
            'current_password' => ['sometimes', 'required_with:password', 'string'],
            'photo_avatar_filename' => ['sometimes', 'nullable', 'string'],
        ];
    }

    /**
     * Custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email already exists.',
            'nickname.unique' => 'This nickname is already taken.',
            'password.min' => 'The password must be at least :min characters.',
            'current_password.required_with' => 'Please provide your current password to change to a new one.',
        ];
    }
}
