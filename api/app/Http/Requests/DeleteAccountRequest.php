<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

class DeleteAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Authentication middleware should ensure the user is authenticated.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for deleting an account.
     * The current password must be provided to confirm the deletion.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
        ];
    }

    /**
     * Add additional validation after the standard rules run.
     * Verifies that the provided current_password matches the authenticated user's password.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            if (! $user) {
                $validator->errors()->add('user', 'Authenticated user not found.');
                return;
            }

            $currentPassword = (string) $this->input('current_password', '');
            if (! Hash::check($currentPassword, $user->password)) {
                $validator->errors()->add('current_password', 'Current password is incorrect.');
            }
        });
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Please provide your current password to confirm account deletion.',
        ];
    }
}
