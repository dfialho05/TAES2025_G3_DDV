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
        // Set default values only if not already provided
        $defaults = [];

        if (!$this->has("status")) {
            $defaults["status"] = "Pending";
        }

        if (!$this->has("type")) {
            $defaults["type"] = "3"; // Default to Bisca dos 3
        }

        // Set default deck if not provided
        if (!$this->has("deck_id")) {
            $deckIdToUse = 1; // Default deck

            // If user is authenticated, try to get their preferred deck
            if ($this->user()) {
                $deckIdToUse = $this->user()->custom["active_deck_id"] ?? 1;
            }

            $defaults["deck_id"] = $deckIdToUse;
        }

        // If player1_user_id is not provided, use the authenticated user
        if (!$this->has("player1_user_id") && $this->user()) {
            $defaults["player1_user_id"] = $this->user()->id;
        }

        // If match_id is provided, inherit type from match (only if not explicitly set)
        if ($this->has("match_id") && $this->match_id) {
            $match = \App\Models\Matches::find($this->match_id);
            if ($match) {
                if (!$this->has("type")) {
                    $defaults["type"] = $match->type;
                }

                // If players are not specified, use match players
                if (!$this->has("player1_user_id")) {
                    $defaults["player1_user_id"] = $match->player1_user_id;
                }

                if (!$this->has("player2_user_id")) {
                    $defaults["player2_user_id"] = $match->player2_user_id;
                }
            }
        }

        $this->merge($defaults);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "match_id" => ["nullable", "integer", "exists:matches,id"],
            "player1_user_id" => ["required", "integer", "exists:users,id"],
            "player2_user_id" => [
                "required",
                "integer",
                "exists:users,id",
                "different:player1_user_id",
            ],
            "deck_id" => ["required", "integer", "exists:decks,id"],
            "type" => ["required", Rule::in(["3", "9"])],
            "status" => [
                "sometimes",
                Rule::in(["Pending", "Playing", "Ended", "Interrupted"]),
            ],
            "winner_user_id" => ["nullable", "integer", "exists:users,id"],
            "loser_user_id" => ["nullable", "integer", "exists:users,id"],
            "began_at" => ["nullable", "date"],
            "ended_at" => ["nullable", "date", "after:began_at"],
            "total_time" => ["nullable", "numeric", "min:0"],
            "player1_points" => ["nullable", "integer", "min:0"],
            "player2_points" => ["nullable", "integer", "min:0"],
            "is_draw" => ["sometimes", "boolean"],
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
            "match_id.exists" => "The selected match does not exist.",
            "player1_user_id.required" => "Player 1 is required.",
            "player1_user_id.exists" => "Player 1 must be a valid user.",
            "player2_user_id.required" => "Player 2 is required.",
            "player2_user_id.exists" => "Player 2 must be a valid user.",
            "player2_user_id.different" =>
                "Player 2 must be different from Player 1.",
            "type.required" => "Game type is required.",
            "type.in" =>
                "Game type must be either 3 (Bisca dos 3) or 9 (Bisca dos 9).",
            "status.in" =>
                "Game status must be one of: Pending, Playing, Ended, or Interrupted.",
            "deck_id.required" => "Deck is required.",
            "deck_id.exists" => "The selected deck does not exist.",
            "winner_user_id.exists" => "Winner must be a valid user.",
            "loser_user_id.exists" => "Loser must be a valid user.",
            "began_at.date" => "Begin time must be a valid date.",
            "ended_at.date" => "End time must be a valid date.",
            "ended_at.after" => "End time must be after begin time.",
            "total_time.numeric" => "Total time must be a number.",
            "total_time.min" => "Total time cannot be negative.",
            "player1_points.integer" => "Player 1 points must be an integer.",
            "player1_points.min" => "Player 1 points cannot be negative.",
            "player2_points.integer" => "Player 2 points must be an integer.",
            "player2_points.min" => "Player 2 points cannot be negative.",
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // If match_id is provided, validate that players match the match
            if ($this->has("match_id") && $this->match_id) {
                $match = \App\Models\Matches::find($this->match_id);
                if ($match) {
                    if (
                        $this->has("player1_user_id") &&
                        $this->has("player2_user_id")
                    ) {
                        $matchPlayers = [
                            $match->player1_user_id,
                            $match->player2_user_id,
                        ];
                        $gamePlayers = [
                            $this->player1_user_id,
                            $this->player2_user_id,
                        ];

                        sort($matchPlayers);
                        sort($gamePlayers);

                        if ($matchPlayers !== $gamePlayers) {
                            $validator
                                ->errors()
                                ->add(
                                    "match_id",
                                    "Game players must match the match players.",
                                );
                        }
                    }

                    // Validate game type matches match type
                    if ($this->has("type") && $this->type !== $match->type) {
                        $validator
                            ->errors()
                            ->add(
                                "type",
                                "Game type must match the match type.",
                            );
                    }
                }
            }

            // Ensure winner and loser are among the players
            if ($this->has("winner_user_id") && $this->winner_user_id) {
                if (
                    !in_array($this->winner_user_id, [
                        $this->player1_user_id,
                        $this->player2_user_id,
                    ])
                ) {
                    $validator
                        ->errors()
                        ->add(
                            "winner_user_id",
                            "Winner must be one of the game players.",
                        );
                }
            }

            if ($this->has("loser_user_id") && $this->loser_user_id) {
                if (
                    !in_array($this->loser_user_id, [
                        $this->player1_user_id,
                        $this->player2_user_id,
                    ])
                ) {
                    $validator
                        ->errors()
                        ->add(
                            "loser_user_id",
                            "Loser must be one of the game players.",
                        );
                }
            }

            // Ensure players are not blocked
            if ($this->has("player1_user_id")) {
                $player1 = \App\Models\User::find($this->player1_user_id);
                if ($player1 && $player1->blocked) {
                    $validator
                        ->errors()
                        ->add(
                            "player1_user_id",
                            "Player 1 is blocked and cannot participate in games.",
                        );
                }
            }

            if ($this->has("player2_user_id")) {
                $player2 = \App\Models\User::find($this->player2_user_id);
                if ($player2 && $player2->blocked) {
                    $validator
                        ->errors()
                        ->add(
                            "player2_user_id",
                            "Player 2 is blocked and cannot participate in games.",
                        );
                }
            }
        });
    }
}
