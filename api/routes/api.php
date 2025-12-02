<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardThemeController;
use App\Http\Controllers\CardFaceController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\MatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (Do not require authentication)
|--------------------------------------------------------------------------
*/

Route::post("/login", [AuthController::class, "login"]);
Route::post("/register", [AuthController::class, "register"]);

Route::get("/metadata", function (Request $request) {
    return [
        "name" => "DAD 2025/26 Project",
        "version" => "0.0.1",
    ];
});

// Games: Public Index, Show, and Store (as per your original code)
Route::apiResource("games", GameController::class)->only([
    "index",
    "show",
    "store",
]);

// --- NEW CHANGE ---
// History of a specific player (PUBLIC)
// Anyone can view the games of user ID 5, for example.
Route::get("/matches/user/{id}", [MatchController::class, "matchesByUser"]);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Require Token)
|--------------------------------------------------------------------------
*/

Route::middleware("auth:sanctum")->group(function () {
    // User Context
    Route::get("/users/me", function (Request $request) {
        return $request->user();
    });
    Route::patch("/users/me", [AuthController::class, "updateProfile"]);
    Route::patch("/users/me/deactivate", [
        AuthController::class,
        "deleteAccount",
    ]);
    Route::post("logout", [AuthController::class, "logout"]);

    // Files
    Route::prefix("files")->group(function () {
        Route::post("userphoto", [FileController::class, "uploadUserPhoto"]);
        Route::post("cardfaces", [FileController::class, "uploadCardFaces"]);
    });

    // Games (Remaining operations)
    Route::apiResource("games", GameController::class)->except([
        "index",
        "show",
        "store",
    ]);

    // Resources
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

    // --- MATCHES (Logged-in User) ---

    // 1. My history (requires knowing who I am -> auth)
    Route::get("/matches/me", [MatchController::class, "history"]);

    // 2. Details of a specific match
    // (Kept private to verify if the user participated in the game or is an admin)
    Route::get("/matches/{id}", [MatchController::class, "show"]);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(["auth:sanctum", "admin"])->group(function () {
    // Only Admin can view the TOTAL list of platform matches
    Route::get("/matches", [MatchController::class, "index"]);
});
