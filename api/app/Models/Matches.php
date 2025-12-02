<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Matches extends Model
{
    use HasFactory;

    // Como o model se chama "Matches", o Laravel assume automaticamente a tabela "matches".
    // Mas podes deixar explícito se quiseres:
    protected $table = "matches";

    protected $fillable = [
        "type",
        "player1_user_id",
        "player2_user_id",
        "winner_user_id",
        "loser_user_id",
        "status",
        "began_at",
        "ended_at",
        "total_time",
        "player1_marks",
        "player2_marks",
        "stake",
    ];

    public function player1(): BelongsTo
    {
        return $this->belongsTo(User::class, "player1_user_id", "id");
    }

    public function player2(): BelongsTo
    {
        return $this->belongsTo(User::class, "player2_user_id", "id");
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, "winner_user_id", "id");
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class, "match_id", "id");
    }
}
