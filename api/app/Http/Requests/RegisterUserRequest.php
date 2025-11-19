<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization handled elsewhere; allow all for registration
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:3'],
            'nickname' => ['sometimes', 'nullable', 'string', 'max:20', 'unique:users,nickname'],
            'photo_avatar_filename' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email already exists.',
            'nickname.unique' => 'This nickname is already taken.',
            'password.min' => 'The password must be at least :min characters.',
        ];
    }
}

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The authenticated user will be validated in controller/middleware
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user() ? $this->user()->id : null;

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
            'password' => ['sometimes', 'nullable', 'string', 'min:3'],
            'photo_avatar_filename' => ['sometimes', 'nullable', 'string'],
            // If client sends current_password to authorize password change, it's validated in controller
            'current_password' => ['sometimes', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email already exists.',
            'nickname.unique' => 'This nickname is already taken.',
            'password.min' => 'The password must be at least :min characters.',
        ];
    }
}

class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only authenticated users allowed to delete their account; middleware enforces auth
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            if (! $user) {
                $validator->errors()->add('user', 'Authenticated user not found.');
                return;
            }

            $currentPassword = $this->input('current_password', '');
            if (! Hash::check($currentPassword, $user->password)) {
                $validator->errors()->add('current_password', 'Current password is incorrect.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Please provide your current password to confirm account deletion.',
        ];
    }
}
