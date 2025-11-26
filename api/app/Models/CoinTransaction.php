<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinTransaction extends Model
{
    protected $fillable = [
        "transaction_datetime",
        "user_id",
        "match_id",
        "game_id",
        "coin_transaction_type_id",
        "coins",
        "custom",
    ];

    protected $casts = [
        "transaction_datetime" => "datetime",
        "custom" => "array",
        "coins" => "integer",
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coinTransactionType()
    {
        return $this->belongsTo(CoinTransactionType::class);
    }

    public function game()
    {
        return $this->belongsTo(Game::class); // ajusta conforme necessário
    }

    public function purchase()
    {
        return $this->hasOne(CoinPurchase::class, "coin_transaction_id");
    }
}
