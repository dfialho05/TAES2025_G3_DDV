<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Game extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        "match_id",
        "player1_user_id",
        "player2_user_id",
        "winner_user_id",
        "deck_id",
        "loser_user_id",
        "type",
        "status",
        "began_at",
        "ended_at",
        "total_time",
        "player1_points",
        "player2_points",
        "is_draw",
        "custom",
    ];

    protected $casts = [
        "began_at" => "datetime",
        "ended_at" => "datetime",
        "player1_points" => "integer",
        "player2_points" => "integer",
        "is_draw" => "boolean",
    ];

    /**
     * Relação com o Player 1
     * CORREÇÃO: Usar BelongsTo em vez de HasOne
     */
  
    public function deck(): BelongsTo
    {
        return $this->belongsTo(Deck::class);
    }
  
    public function player1(): BelongsTo
    {
        return $this->belongsTo(User::class, "player1_user_id", "id");
    }

    /**
     * Relação com o Player 2
     * CORREÇÃO: Usar BelongsTo em vez de HasOne
     */
    public function player2(): BelongsTo
    {
        return $this->belongsTo(User::class, "player2_user_id", "id");
    }

    /**
     * Relação com o vencedor
     * CORREÇÃO: Usar BelongsTo em vez de HasOne
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, "winner_user_id", "id");
    }

    /**
     * Relação com a partida (match) pai
     */
    public function match(): BelongsTo
    {
        return $this->belongsTo(Matches::class, "match_id", "id");
    }

    /**
     * Scope para filtrar jogos de um utilizador específico
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
     * Scope para jogos finalizados
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
     * Método auxiliar para verificar se um utilizador participou neste jogo
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
     * Método auxiliar para verificar se um utilizador venceu este jogo
     */
    public function isWinner($userId): bool
    {
        return $this->winner_user_id == $userId;
    }
}
