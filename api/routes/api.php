<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/metadata', function (Request $request) {
    return [
        "name" => "DAD 2025/26 Worksheet API",
        "version" => "0.0.1"
        ];
});
