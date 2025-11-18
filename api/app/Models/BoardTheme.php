<?php

namespace App\Models;

use App\Policies\BoardThemePolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;

class BoardTheme extends Model
{
    protected $fillable = [
        'name',
        'description',
        'user_id',
        'visibility',
    ];

    public function cardFaces()
    {
        return $this->hasMany(CardFace::class);
    }
}
