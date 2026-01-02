<?php

use App\Http\Controllers\AdminController;
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
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\StatisticsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\CoinTransaction;

/*
|--------------------------------------------------------------------------
| Public Metadata & Info (Baixo limite - raramente mudam)
|--------------------------------------------------------------------------
*/
Route::middleware(["throttle:api"])->group(function () {
    Route::get("/metadata", function (Request $request) {
        return [
            "name" => "DAD 2025/26 Project",
            "version" => "0.0.1",
            "status" => "active",
            "timestamp" => now()->toISOString(),
        ];
    });

    Route::get("/stakes/info", function () {
        return response()->json([
            "match_stake" => 10,
            "game_stake" => 2,
            "match_payout" => 20,
            "game_payout" => 4,
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Public Authentication Routes - PROTEÇÃO RÍGIDA (Anti-Brute Force)
|--------------------------------------------------------------------------
*/
Route::middleware(["throttle:auth"])->group(function () {
    Route::post("/login", [AuthController::class, "login"]);
    Route::post("/register", [AuthController::class, "register"]);
});

/*
|--------------------------------------------------------------------------
| Public Routes (General API Limit)
|--------------------------------------------------------------------------
*/
Route::middleware(["throttle:api"])->group(function () {
    Route::get("/leaderboard", [
        LeaderboardController::class,
        "getLeaderboard",
    ]);
    Route::get("/leaderboards/all", [
        LeaderboardController::class,
        "getAllLeaderboards",
    ]);
    Route::get("/users/{id}/statistics", [
        StatisticsController::class,
        "getUserStats",
    ]);

    // Basic Game Operations (Public)
    Route::apiResource("games", GameController::class)->only([
        "index",
        "show",
        "store",
    ]);

    // Decks & Assets
    Route::get("/decks", [DeckController::class, "index"]);
    Route::get("/decks/{deckSlug}", [DeckController::class, "show"]);
    Route::get("/decks/{deckSlug}/assets", [
        DeckController::class,
        "getDeckAssets",
    ]);
    Route::get("/decks/{deckSlug}/files", [
        DeckController::class,
        "listDeckFiles",
    ]);
    Route::get("/decks/{deckSlug}/image/{cardName}", [
        DeckController::class,
        "getCardImage",
    ]);

    // Profile & History
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

    Route::get("/users/{id}/games/recent", [
        GameController::class,
        "recentGames",
    ]);
    Route::get("/users/{id}/games", [GameController::class, "getAllUserGames"]);
    Route::get("/users/{id}/games/stats", [GameController::class, "userStats"]);
    Route::get("/users/{id}/matches/recent", [
        MatchController::class,
        "recentMatches",
    ]);
    Route::get("/users/{id}/matches", [
        MatchController::class,
        "getAllUserMatches",
    ]);
    Route::get("/users/{id}/matches/stats", [
        MatchController::class,
        "userStats",
    ]);
    Route::get("/matches/user/{id}", [MatchController::class, "matchesByUser"]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Require Token) - GAMEPLAY LIMIT
|--------------------------------------------------------------------------
*/
Route::middleware(["auth:sanctum", "throttle:gameplay"])->group(function () {
    // Me / Profile
    Route::get("/users/me", function (Request $request) {
        return new \App\Http\Resources\UserResource($request->user());
    });
    Route::patch("/users/me", [AuthController::class, "updateProfile"]);
    Route::patch("/users/me/deactivate", [
        AuthController::class,
        "deleteAccount",
    ]);
    Route::post("/logout", [AuthController::class, "logout"]);

    // File Uploads (Considerar limite próprio se necessário)
    Route::post("/files/userphoto", [FileController::class, "uploadUserPhoto"]);
    Route::post("/files/cardfaces", [FileController::class, "uploadCardFaces"]);

    // Personal Match/Game Management
    Route::get("/matches/me", [MatchController::class, "history"]);
    Route::post("/matches", [MatchController::class, "store"]);
    Route::get("/matches/{id}", [MatchController::class, "show"]);
    Route::patch("/matches/{id}", [MatchController::class, "update"]);
    Route::post("/matches/{id}/start", [MatchController::class, "startMatch"]);
    Route::post("/matches/{id}/finish", [
        MatchController::class,
        "finishMatch",
    ]);
    Route::post("/matches/{id}/cancel", [
        MatchController::class,
        "cancelMatch",
    ]);
    Route::get("/matches/{id}/transactions", [
        MatchController::class,
        "getMatchTransactions",
    ]);

    Route::post("/matches/{matchId}/games", [
        GameController::class,
        "createGameForMatch",
    ]);
    Route::get("/matches/{matchId}/games", [
        GameController::class,
        "gamesByMatch",
    ]);
    Route::post("/games/{id}/start", [GameController::class, "startGame"]);
    Route::post("/games/{id}/finish", [GameController::class, "finishGame"]);

    // Store & Purchases
    Route::post("/purchases/", [CoinPurchaseController::class, "initiate"]);
    Route::get("/store/decks", [StoreController::class, "index"]);
    Route::post("/store/buy", [StoreController::class, "buy"]);
    Route::post("/store/equip", [StoreController::class, "toggleActive"]);

    Route::get("/transactions", function (Request $request) {
        $user = $request->user();
        $transactions = CoinTransaction::where("user_id", $user->id)
            ->orderBy("transaction_datetime", "desc")
            ->paginate(15);
        return response()->json($transactions);
    });

    // Resources
    Route::apiResources([
        "card-faces" => CardFaceController::class,
        "board-themes" => BoardThemeController::class,
        "users" => UserController::class,
    ]);
    Route::patch("/users/{user}/photo-url", [
        UserController::class,
        "patchPhotoURL",
    ]);

    /*
    |--------------------------------------------------------------------------
    | ADMIN ONLY SUB-GROUP
    |--------------------------------------------------------------------------
    */
    Route::middleware("admin")->group(function () {
        Route::get("/admin/stats", [AdminController::class, "stats"]);
        Route::get("/admin/transactions", [
            AdminController::class,
            "allTransactions",
        ]);
        Route::get("/matches", [MatchController::class, "index"]);
        Route::delete("/matches/{id}", [MatchController::class, "destroy"]);
        Route::get("/admin/users", [AdminController::class, "listUsers"]);
        Route::get("/admin/users/{id}", [AdminController::class, "showUser"]);
        Route::get("/admin/users/{id}/transactions", [
            AdminController::class,
            "userTransactions",
        ]);
        Route::post("/admin/users/create-admin", [
            AdminController::class,
            "createAdmin",
        ]);
        Route::patch("/admin/users/{id}/block", [
            AdminController::class,
            "blockUser",
        ]);
        Route::patch("/admin/users/{id}/unblock", [
            AdminController::class,
            "unblockUser",
        ]);
        Route::delete("/admin/users/{id}", [
            AdminController::class,
            "destroyUser",
        ]);
        Route::get("/admin/charts", [AdminController::class, "getChartData"]);
    });
});

/*
|--------------------------------------------------------------------------
| Media & Debug (Frequência alta permitida para imagens)
|--------------------------------------------------------------------------
*/
Route::middleware(["throttle:gameplay"])->group(function () {
    Route::get("/avatars/{filename}", [AvatarController::class, "show"])->where(
        "filename",
        "[a-zA-Z0-9_\-\.]+",
    );
    Route::options("/avatars/{filename}", [
        AvatarController::class,
        "options",
    ])->where("filename", "[a-zA-Z0-9_\-\.]+");
    Route::get("/avatars-stats", [AvatarController::class, "stats"]);

    Route::get("/debug-image/{slug}", function ($slug) {
        $path = storage_path("app/public/decks/{$slug}/preview.png");
        if (!file_exists($path)) {
            return response("❌ Ficheiro não encontrado", 404);
        }
        return response()->file($path, ["Cache-Control" => "no-store"]);
    });
});

if (env("APP_DEBUG", false)) {
    Route::get("/debug/admin-users-raw", function () {
        return \App\Models\User::withTrashed()
            ->orderByDesc("created_at")
            ->get();
    });
}

Route::fallback(function () {
    return response()->json(["message" => "API endpoint not found"], 404);
});
