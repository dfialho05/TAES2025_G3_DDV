<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
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
     * @var list<string>
     */
    protected $hidden = ["password", "remember_token"];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        "email_verified_at" => "datetime",
        "deleted_at" => "datetime",
        "password" => "hashed",
        "coins_balance" => "integer",
        "custom" => "array",
        "blocked" => "boolean",
    ];

    public function isBlocked(): bool
    {
        return (bool) $this->blocked;
    }

    public function isType(string $type): bool
    {
        return $this->type === $type;
    }

    public function getBalance(): int
    {
        return (int) $this->coins_balance;
    }

    // public function gamesAsPlayer1(): HasMany
    // {
    //     return $this->hasMany(Game::class, "player1_id");
    // }

    // public function gamesAsPlayer2(): HasMany
    // {
    //     return $this->hasMany(Game::class, "player2_id");
    // }

    // public function gamesWon(): HasMany
    // {
    //     return $this->hasMany(Game::class, "winner_id");
    // }

    // public function gamesQuery(): \Illuminate\Database\Eloquent\Builder
    // {
    //     return Game::where("player1_id", $this->id)->orWhere(
    //         "player2_id",
    //         $this->id,
    //     );
    // }
}
