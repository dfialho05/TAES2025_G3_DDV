<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\BoardThemeController;
use App\Http\Controllers\CardFaceController;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\MatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Metadata
|--------------------------------------------------------------------------
*/

Route::get("/metadata", function (Request $request) {
    return [
        "name" => "DAD 2025/26 Project",
        "version" => "0.0.1",
        "status" => "active",
        "timestamp" => now()->toISOString(),
    ];
});

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

Route::post("/login", [AuthController::class, "login"]);
Route::post("/register", [AuthController::class, "register"]);

/*
|--------------------------------------------------------------------------
| Public Game Routes (No Authentication Required)
|--------------------------------------------------------------------------
*/

// Individual leaderboard categories
Route::get("/leaderboard", [
    \App\Http\Controllers\LeaderboardController::class,
    "getLeaderboard",
]);

// All leaderboards at once (for dashboard view)
Route::get("/leaderboards/all", [
    \App\Http\Controllers\LeaderboardController::class,
    "getAllLeaderboards",
]);

Route::get("/users/{id}/statistics", [
    App\Http\Controllers\StatisticsController::class,
    "getUserStats",
]);

// Basic Game Operations
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
/*
|--------------------------------------------------------------------------
| Public Profile & History Routes (Optimized for Performance)
|--------------------------------------------------------------------------
*/

// OTIMIZADO: Histórico de Jogos Individuais (Para lista simples no perfil)
Route::get("/users/{id}/games/recent", [GameController::class, "recentGames"]);

// NOVO: Histórico completo de jogos com paginação (Para página de histórico)
Route::get("/users/{id}/games", [GameController::class, "getAllUserGames"]);

// OTIMIZADO: Histórico de Partidas com detalhes (Para acordeão no perfil)
Route::get("/users/{id}/matches/recent", [
    MatchController::class,
    "recentMatches",
]);

// NOVO: Histórico completo de partidas com paginação (Para página de histórico)
Route::get("/users/{id}/matches", [
    MatchController::class,
    "getAllUserMatches",
]);

// Buscar dados públicos do utilizador (Para página de histórico)
Route::get("/users/{id}/profile", function ($id) {
    $user = \App\Models\User::find($id);
    if (!$user) {
        return response()->json(["message" => "User not found"], 404);
    }
    return response()->json([
        "id" => $user->id,
        "name" => $user->name,
        "nickname" => $user->nickname,
        "photo_avatar_filename" => $user->photo_avatar_filename,
        "type" => $user->type,
        "created_at" => $user->created_at,
    ]);
});

// Estatísticas públicas de utilizador
Route::get("/users/{id}/games/stats", [GameController::class, "userStats"]);
Route::get("/users/{id}/matches/stats", [MatchController::class, "userStats"]);

// ORIGINAL: Histórico completo de partidas (Mantido para compatibilidade)
Route::get("/matches/user/{id}", [MatchController::class, "matchesByUser"]);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Require Valid Token)
|--------------------------------------------------------------------------
*/

Route::middleware("auth:sanctum")->group(function () {
    /*
    |--------------------------------------------------------------------------
    | User Context & Profile Management
    |--------------------------------------------------------------------------
    */

    // Current User Info
    Route::get("/users/me", function (Request $request) {
        return new \App\Http\Resources\UserResource($request->user());
    });

    // Profile Updates
    Route::patch("/users/me", [AuthController::class, "updateProfile"]);
    Route::patch("/users/me/deactivate", [
        AuthController::class,
        "deleteAccount",
    ]);

    // Authentication
    Route::post("logout", [AuthController::class, "logout"]);

    /*
    |--------------------------------------------------------------------------
    | File Upload Management
    |--------------------------------------------------------------------------
    */

    Route::prefix("files")->group(function () {
        Route::post("userphoto", [FileController::class, "uploadUserPhoto"]);
        Route::post("cardfaces", [FileController::class, "uploadCardFaces"]);
    });

    /*
    |--------------------------------------------------------------------------
    | Game Management (Authenticated Operations)
    |--------------------------------------------------------------------------
    */

    // Protected Game Operations
    Route::apiResource("games", GameController::class)->except([
        "index",
        "show",
        "store",
    ]);

    // Additional Game Endpoints
    Route::get("/matches/{matchId}/games", [
        GameController::class,
        "gamesByMatch",
    ]);

    /*
    |--------------------------------------------------------------------------
    | Personal Match History (User Context Required)
    |--------------------------------------------------------------------------
    */

    // Personal match history (requires authentication to know "me")
    Route::get("/matches/me", [MatchController::class, "history"]);

    // Match details (security enforced in controller)
    Route::get("/matches/{id}", [MatchController::class, "show"]);

    // Match management
    Route::post("/matches", [MatchController::class, "store"]);
    Route::patch("/matches/{id}", [MatchController::class, "update"]);

    /*
    |--------------------------------------------------------------------------
    | User & Resource Management
    |--------------------------------------------------------------------------
    */

    Route::apiResources([
        "users" => UserController::class,
        "card-faces" => CardFaceController::class,
        "board-themes" => BoardThemeController::class,
    ]);

    // Additional User Operations
    Route::patch("/users/{user}/photo-url", [
        UserController::class,
        "patchPhotoURL",
    ]);

    /*
    |--------------------------------------------------------------------------
    | E-commerce & Purchases
    |--------------------------------------------------------------------------
    */

    Route::post("/purchases/", [CoinPurchaseController::class, "initiate"]);

    Route::get("/store/decks", [StoreController::class, "index"]);
    Route::post("/store/buy", [StoreController::class, "buy"]);
    Route::post("/store/equip", [StoreController::class, "toggleActive"]);
});

/*
|--------------------------------------------------------------------------
| Avatar Image Routes (Public with CORS headers)
|--------------------------------------------------------------------------
*/

// Avatar image serving
Route::get("/avatars/{filename}", [AvatarController::class, "show"])->where(
    "filename",
    "[a-zA-Z0-9_\-\.]+",
);

// CORS preflight for avatars
Route::options("/avatars/{filename}", [
    AvatarController::class,
    "options",
])->where("filename", "[a-zA-Z0-9_\-\.]+");

// Avatar statistics (for debugging)
Route::get("/avatars-stats", [AvatarController::class, "stats"]);

// Avatar test endpoint (for debugging)
Route::get("/avatars-test/{filename}", [
    AvatarController::class,
    "test",
])->where("filename", "[a-zA-Z0-9_\-\.]+");

/*
|--------------------------------------------------------------------------
| Admin Only Routes (Require Admin Privileges)
|--------------------------------------------------------------------------
*/

Route::middleware(["auth:sanctum", "admin"])->group(function () {
    // Platform-wide match management (Admin only)
    Route::get("/matches", [MatchController::class, "index"]);
    Route::delete("/matches/{id}", [MatchController::class, "destroy"]);

    // Platform statistics and monitoring could go here
    // Route::get("/admin/stats", [AdminController::class, "platformStats"]);
});

/*
|--------------------------------------------------------------------------
| Fallback Route for API
|--------------------------------------------------------------------------
*/

Route::fallback(function () {
    return response()->json(
        [
            "message" => "API endpoint not found",
            "available_endpoints" => [
                "GET /metadata" => "API information",
                "POST /login" => "User authentication",
                "POST /register" => "User registration",
                "GET /users/{id}/games/recent" =>
                    "Recent games for user profile",
                "GET /users/{id}/matches/recent" =>
                    "Recent matches for user profile",
            ],
        ],
        404,
    );
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
