<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardThemeController;
use App\Http\Controllers\CardFaceController;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\StoreController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post("/login", [AuthController::class, "login"]);
Route::post("/register", [AuthController::class, "register"]);

Route::apiResource("games", GameController::class)->only([
    "index",
    "show",
    "store",
]);

// Rotas públicas para decks (imagens podem ser acessadas sem autenticação)
Route::get("/decks", [DeckController::class, "index"]);
Route::get("/decks/{deckSlug}/image/{cardName}", [
    DeckController::class,
    "getCardImage",
]);
Route::get("/decks/{deckSlug}/assets", [
    DeckController::class,
    "getDeckAssets",
]);
Route::get("/decks/{deckSlug}", [DeckController::class, "show"]);
Route::get("/decks/{deckSlug}/files", [DeckController::class, "listDeckFiles"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::get("/users/me", function (Request $request) {
        return $request->user();
    });

    // updateProfile
    Route::patch("/users/me", [AuthController::class, "updateProfile"]);
    // soft delete (deactivate account)
    Route::patch("/users/me/deactivate", [
        AuthController::class,
        "deleteAccount",
    ]);

    Route::post("logout", [AuthController::class, "logout"]);

    Route::prefix("files")->group(function () {
        Route::post("userphoto", [FileController::class, "uploadUserPhoto"]);
        Route::post("cardfaces", [FileController::class, "uploadCardFaces"]);
    });

    Route::apiResource("games", GameController::class)->except([
        "index",
        "show",
        "store",
    ]);

    Route::apiResources([
        "users" => UserController::class,
        "card-faces" => CardFaceController::class,
        "board-themes" => BoardThemeController::class,
    ]);
    Route::patch("/users/{user}/photo-url", [
        UserController::class,
        "patchPhotoURL",
    ]);

    Route::post("/purchases/", [CoinPurchaseController::class, "initiate"]);

    Route::get("/store/decks", [StoreController::class, "index"]);
    Route::post("/store/buy", [StoreController::class, "buy"]);
    Route::post("/store/equip", [StoreController::class, "toggleActive"]);
});

Route::get("/metadata", function (Request $request) {
    return [
        "name" => "DAD 2025/26 Projeto",
        "version" => "0.0.1",
    ];
});

// Rota de Debug Visual (Apagar depois)
Route::get("/debug-image/{slug}", function ($slug) {
    // 1. Constrói o caminho exato
    $path = storage_path("app/public/decks/{$slug}/preview.png");

    // 2. Se não existir, mostra o erro no ecrã em vez de tentar adivinhar
    if (!file_exists($path)) {
        return response(
            "❌ ERRO: O ficheiro não foi encontrado neste caminho exato:<br><strong>" .
                $path .
                "</strong>",
            404,
        );
    }

    // 3. Se existir, mostra a imagem e força o browser a não guardar cache
    return response()->file($path, [
        "Cache-Control" => "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma" => "no-cache",
    ]);
});
