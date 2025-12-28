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
        return true; // Authorization is handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'nickname' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'nickname')->ignore($user->id),
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:3'],
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
            'nickname' => 'nickname',
            'password' => 'password',
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
            'email.unique' => 'This email address is already in use.',
            'nickname.unique' => 'This nickname is already taken.',
            'nickname.max' => 'The nickname must not exceed 20 characters.',
            'password.min' => 'The password must be at least 3 characters.',
        ];
    }
}
