<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "match_id" => $this->match_id,
            "player1" => new UserResource($this->player1),
            "player2" => new UserResource($this->whenLoaded("player2")),
            "winner" => new UserResource($this->whenLoaded("winner")),
            "deck" => $this->whenLoaded("deck"),
            "type" => $this->type,
            "status" => $this->status,
            "player1_moves" => $this->player1_moves,
            "player2_moves" => $this->player2_moves,
            "total_time" => $this->total_time,
            "began_at" => $this->began_at,
            "ended_at" => $this->ended_at,
            "winner_user_id" => $this->winner_user_id,
            "created_at" => $this->created_at,
            "updated_at" => $this->updated_at,
        ];
    }
}
