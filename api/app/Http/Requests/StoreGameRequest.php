<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }


    protected function prepareForValidation()
    {
        // 1. Define o Default
        $deckIdToUse = 1;
        $userId = null;

        // 2. Se for um User Autenticado, tenta buscar a preferência dele
        if ($this->user()) {
            $deckIdToUse = $this->user()->custom['active_deck_id'] ?? 1;
            $userId = $this->user()->id;
        }
        // 3. Injeta no pedido (sobrescreve qualquer coisa que venha do frontend)
        $this->merge([
            'deck_id' => $deckIdToUse,
            'player1_user_id' => $userId,
            'player2_user_id' => null, 
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'player1_user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                
            ],
            'deck_id' => [
                'required', 
                'integer',
                'exists:decks,id'
            ],
            'type' => ['required', Rule::in(['S', 'M'])],
            'status' => ['required', Rule::in(['PE', 'PL', 'E', 'I'])],
            'player2_id' => [
                'nullable',
                'required_if:type,M',
                'exists:users,id',
                'different:player1_id',
            ],
            'player1_moves' => ['nullable', 'integer'],
            'player2_moves' => ['nullable', 'integer'],
            'began_at' => ['nullable', 'date'],
            'ended_at' => ['nullable', 'date'],
            'total_time' => ['nullable', 'integer'],
        ];
    }

    /**
     * Get the validation messages for invalid fields.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'player1_id.integer' => 'Creator ID must be an integer.',
            'player1_id.exists' => 'The selected player does not exist.',
            'type.required' => 'Game type is required.',
            'type.in' => 'Game type must be either S (Single Player) or M (Multiplayer).',
            'status.required' => 'Game status is required.',
            'status.in' => 'Game status must be on of: PE - PEnding , PL - PLaying, E - Ended, I - Interrupted ',
            'player2_id.required_if' => 'Player 2 is required for multiplayer games.',
            'player2_id.exists' => 'The selected player does not exist.',
            'player2_id.different' => 'Player 2 must be different from the creator.',
            'deck_id.exists' => 'The selected deck does not exist.',
        ];
    }
}
