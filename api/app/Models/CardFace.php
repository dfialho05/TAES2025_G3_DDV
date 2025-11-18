<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardFace extends Model
{
    protected $fillable = [
        'board_theme_id',
        'face_image_url',
    ];
}
