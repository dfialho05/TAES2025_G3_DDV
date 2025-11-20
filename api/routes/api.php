<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardThemeController;
use App\Http\Controllers\CardFaceController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::apiResource('games', GameController::class)->only(['index', 'show', 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });

    Route::post('logout', [AuthController::class, 'logout']);

    Route::prefix('files')->group(function () {
        Route::post('userphoto', [FileController::class, 'uploadUserPhoto']);
        Route::post('cardfaces', [FileController::class, 'uploadCardFaces']);
    });

    Route::apiResource('games', GameController::class)->except(['index', 'show', 'store']);

    Route::apiResources([
        'users' => UserController::class,
        'card-faces' => CardFaceController::class,
        'board-themes' => BoardThemeController::class,
    ]);
    Route::patch('/users/{user}/photo-url', [UserController::class, 'patchPhotoURL']);
});

Route::get('/metadata', function (Request $request) {
    return [
        'name' => 'DAD 2025/26 Worksheet API',
        'version' => '0.0.1',
    ];
});
