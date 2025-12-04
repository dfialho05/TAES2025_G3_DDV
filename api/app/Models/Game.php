<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'player1_id',
        'player2_id',
        'winner_id',
        'deck_id',
        'type',
        'status',
        'began_at',
        'ended_at',
        'total_time',
        'player1_moves',
        'player2_moves',
    ];

    public function deck(): BelongsTo
    {
        return $this->belongsTo(Deck::class);
    }

    public function player1(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player1_id');
    }

    public function player2(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player2_id');
    }

    public function winner(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'winner_id');
    }
}
