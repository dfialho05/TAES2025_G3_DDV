<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set default values if not provided
        $this->merge([
            "type" => $this->type ?? "3", // Default to Bisca dos 3
            "status" => $this->status ?? "Pending",
            "stake" => $this->stake ?? 3,
        ]);

        // If player1_user_id is not provided, use the authenticated user
        if (!$this->has("player1_user_id") && $this->user()) {
            $this->merge([
                "player1_user_id" => $this->user()->id,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            "type" => ["required", Rule::in(["3", "9"])],
            "player1_user_id" => ["required", "integer", "exists:users,id"],
            "player2_user_id" => [
                "required",
                "integer",
                "exists:users,id",
                "different:player1_user_id",
            ],
            "status" => [
                "sometimes",
                Rule::in(["Pending", "Playing", "Ended", "Interrupted"]),
            ],
            "stake" => ["sometimes", "integer", "min:0"],
            "began_at" => ["nullable", "date"],
            "ended_at" => ["nullable", "date", "after:began_at"],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            "type.required" => "Match type is required.",
            "type.in" =>
                "Match type must be either 3 (Bisca dos 3) or 9 (Bisca dos 9).",
            "player1_user_id.required" => "Player 1 is required.",
            "player1_user_id.exists" => "Player 1 must be a valid user.",
            "player2_user_id.required" => "Player 2 is required.",
            "player2_user_id.exists" => "Player 2 must be a valid user.",
            "player2_user_id.different" =>
                "Player 2 must be different from Player 1.",
            "status.in" =>
                "Match status must be one of: Pending, Playing, Ended, or Interrupted.",
            "stake.integer" => "Stake must be an integer.",
            "stake.min" => "Stake must be at least 0.",
            "began_at.date" => "Begin time must be a valid date.",
            "ended_at.date" => "End time must be a valid date.",
            "ended_at.after" => "End time must be after begin time.",
        ];
    }

    /**
     * Configure the validator instance.
     */
    /**
     * Configure the validator instance.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Ensure players are not blocked
            if ($this->has("player1_user_id")) {
                $player1 = \App\Models\User::where(
                    "id",
                    $this->player1_user_id,
                )->first();
                if ($player1 && $player1->blocked) {
                    $validator
                        ->errors()
                        ->add(
                            "player1_user_id",
                            "Player 1 is blocked and cannot participate in matches.",
                        );
                }
            }

            if ($this->has("player2_user_id")) {
                $player2 = \App\Models\User::where(
                    "id",
                    $this->player2_user_id,
                )->first();
                if ($player2 && $player2->blocked) {
                    $validator
                        ->errors()
                        ->add(
                            "player2_user_id",
                            "Player 2 is blocked and cannot participate in matches.",
                        );
                }
            }

            // Check if players have enough coins for the stake
            if ($this->has("stake") && $this->stake > 0) {
                if ($this->has("player1_user_id")) {
                    $player1 = \App\Models\User::where(
                        "id",
                        $this->player1_user_id,
                    )->first();
                    if ($player1 && $player1->coins_balance < $this->stake) {
                        $validator
                            ->errors()
                            ->add(
                                "stake",
                                "Player 1 does not have enough coins for this stake.",
                            );
                    }
                }

                if ($this->has("player2_user_id")) {
                    $player2 = \App\Models\User::where(
                        "id",
                        $this->player2_user_id,
                    )->first();
                    if ($player2 && $player2->coins_balance < $this->stake) {
                        $validator
                            ->errors()
                            ->add(
                                "stake",
                                "Player 2 does not have enough coins for this stake.",
                            );
                    }
                }
            }
        });
    }
}
