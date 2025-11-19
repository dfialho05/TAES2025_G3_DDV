<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int,string>
     */
    protected $fillable = [
        "name",
        "email",
        "password",
        "type",
        "nickname",
        "blocked",
        "photo_avatar_filename",
        "coins_balance",
        "custom",
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int,string>
     */
    protected $hidden = ["password", "remember_token"];

    /**
     * The attributes that should be cast.
     *
     * @var array<string,string>
     */
    protected $casts = [
        "email_verified_at" => "datetime",
        "deleted_at" => "datetime",
        "password" => "hashed",
        "coins_balance" => "integer",
        "custom" => "array",
        "blocked" => "boolean",
    ];

    /**
     * Return true if user is blocked.
     */
    public function isBlocked(): bool
    {
        return (bool) $this->blocked;
    }

    /**
     * Check user type (e.g. 'A' for admin, 'P' for player).
     */
    public function isType(string $type): bool
    {
        return $this->type === $type;
    }

    /**
     * Get the user's coin balance as integer.
     */
    public function getBalance(): int
    {
        return (int) $this->coins_balance;
    }

    // estas tavam no template da aula depois temos de implementar
    //
    // /**
    //  * Relationships with games.
    //  */
    // public function gamesAsPlayer1(): HasMany
    // {
    //     return $this->hasMany(Game::class, "player1_user_id");
    // }

    // public function gamesAsPlayer2(): HasMany
    // {
    //     return $this->hasMany(Game::class, "player2_user_id");
    // }

    // public function gamesWon(): HasMany
    // {
    //     return $this->hasMany(Game::class, "winner_user_id");
    // }

    // /**
    //  * Helper to build a games query involving this user (player1 or player2).
    //  */
    // public function gamesQuery(): \Illuminate\Database\Eloquent\Builder
    // {
    //     return Game::where("player1_user_id", $this->id)->orWhere(
    //         "player2_user_id",
    //         $this->id,
    //     );
    // }
}
