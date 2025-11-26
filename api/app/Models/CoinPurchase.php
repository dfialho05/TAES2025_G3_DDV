<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinPurchase extends Model
{
    protected $fillable = [
        "purchase_datetime",
        "user_id",
        "coin_transaction_id",
        "euros",
        "payment_type",
        "payment_reference",
        "custom",
    ];

    protected $casts = [
        "purchase_datetime" => "datetime",
        "euros" => "decimal:2",
        "custom" => "array",
    ];

    public const PAYMENT_MBWAY = "MBWAY";
    public const PAYMENT_IBAN = "IBAN";
    public const PAYMENT_MB = "MB";
    public const PAYMENT_VISA = "VISA";
    public const PAYMENT_PAYPAL = "PAYPAL";

    public static function paymentTypes(): array
    {
        return [
            self::PAYMENT_MBWAY,
            self::PAYMENT_IBAN,
            self::PAYMENT_MB,
            self::PAYMENT_VISA,
            self::PAYMENT_PAYPAL,
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coinTransaction()
    {
        return $this->belongsTo(CoinTransaction::class);
    }
}
