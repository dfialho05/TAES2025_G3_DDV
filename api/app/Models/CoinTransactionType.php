<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoinTransactionType extends Model
{
    use SoftDeletes;

    protected $fillable = ["name", "type", "custom"];

    protected $casts = [
        "custom" => "array",
    ];

    public $timestamps = false;

    public const TYPE_CREDIT = "C";
    public const TYPE_DEBIT = "D";

    public function coinTransactions()
    {
        return $this->hasMany(CoinTransaction::class);
    }
}
