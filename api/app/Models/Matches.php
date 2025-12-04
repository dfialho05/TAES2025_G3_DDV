<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Matches extends Model
{
    use HasFactory;

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

    protected $casts = [
        "began_at" => "datetime",
        "ended_at" => "datetime",
        "player1_marks" => "integer",
        "player2_marks" => "integer",
        "stake" => "decimal:2",
    ];

    /**
     * Relação com o Player 1
     */
    public function player1(): BelongsTo
    {
        return $this->belongsTo(User::class, "player1_user_id", "id");
    }

    /**
     * Relação com o Player 2
     */
    public function player2(): BelongsTo
    {
        return $this->belongsTo(User::class, "player2_user_id", "id");
    }

    /**
     * Relação com o vencedor
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, "winner_user_id", "id");
    }

    /**
     * Relação com o perdedor
     */
    public function loser(): BelongsTo
    {
        return $this->belongsTo(User::class, "loser_user_id", "id");
    }

    /**
     * Relação com os jogos desta partida
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class, "match_id", "id");
    }

    /**
     * Scope para filtrar partidas de um utilizador específico
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where("player1_user_id", $userId)->orWhere(
                "player2_user_id",
                $userId,
            );
        });
    }

    /**
     * Scope para partidas finalizadas
     */
    public function scopeFinished($query)
    {
        return $query->where("status", "Ended");
    }

    /**
     * Scope para ordenar por data de início (mais recente primeiro)
     */
    public function scopeLatest($query)
    {
        return $query->orderBy("began_at", "desc");
    }

    /**
     * Método auxiliar para verificar se um utilizador participou nesta partida
     */
    public function hasPlayer($userId): bool
    {
        return $this->player1_user_id == $userId ||
            $this->player2_user_id == $userId;
    }

    /**
     * Método auxiliar para obter o oponente de um utilizador
     */
    public function getOpponent($userId)
    {
        if ($this->player1_user_id == $userId) {
            return $this->player2;
        } elseif ($this->player2_user_id == $userId) {
            return $this->player1;
        }
        return null;
    }

    /**
     * Método auxiliar para verificar se um utilizador venceu esta partida
     */
    public function isWinner($userId): bool
    {
        return $this->winner_user_id == $userId;
    }
}
