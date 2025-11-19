<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Register a new user and return an auth token.
     * Adds a welcome bonus of 10 coins to the created user (stored on the user record).
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            "name" => ["required", "string", "max:255"],
            "email" => [
                "required",
                "string",
                "email",
                "max:255",
                "unique:users,email",
            ],
            "password" => ["required", "string", "min:3"],
            "nickname" => [
                "sometimes",
                "nullable",
                "string",
                "max:20",
                "unique:users,nickname",
            ],
            "photo_avatar_filename" => ["sometimes", "nullable", "string"],
        ]);

        $user = User::create([
            "name" => $data["name"],
            "email" => $data["email"],
            "password" => Hash::make($data["password"]),
            "nickname" => $data["nickname"] ?? null,
            "photo_avatar_filename" => $data["photo_avatar_filename"] ?? null,
            "coins_balance" => 10,
        ]);

        $token = $user->createToken("auth-token")->plainTextToken;

        return response()->json(
            [
                "token" => $token,
                "user" => $user,
            ],
            201,
        );
    }

    public function login(Request $request)
    {
        $request->validate([
            "email" => "required|email",
            "password" => "required",
        ]);

        if (!Auth::attempt($request->only("email", "password"))) {
            throw ValidationException::withMessages([
                "email" => ["The provided credentials are incorrect."],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken("auth-token")->plainTextToken;

        return response()->json([
            "token" => $token,
        ]);
    }

    /**
     * Update authenticated user's profile.
     * - email and nickname uniqueness ignore current user ID
     * - password is optional; if present it will be hashed
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            "name" => ["sometimes", "required", "string", "max:255"],
            "email" => [
                "sometimes",
                "required",
                "string",
                "email",
                "max:255",
                Rule::unique("users")->ignore($user->id),
            ],
            "nickname" => [
                "sometimes",
                "nullable",
                "string",
                "max:20",
                Rule::unique("users")->ignore($user->id),
            ],
            "password" => ["sometimes", "nullable", "string", "min:3"],
            "photo_avatar_filename" => ["sometimes", "nullable", "string"],
        ]);

        if (
            array_key_exists("password", $data) &&
            $data["password"] !== null &&
            $data["password"] !== ""
        ) {
            $data["password"] = Hash::make($data["password"]);
        } else {
            unset($data["password"]);
        }

        $user->update($data);

        return response()->json($user);
    }

    /**
     * Delete authenticated user's account.
     * Requires current password confirmation and prevents administrators from self-deleting.
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        $request->validate([
            "current_password" => ["required", "string"],
        ]);

        if (
            !Hash::check($request->input("current_password"), $user->password)
        ) {
            return response()->json(
                [
                    "message" => "Current password is incorrect.",
                ],
                422,
            );
        }

        // Administrators are not allowed to delete their own accounts
        if (isset($user->type) && $user->type === "A") {
            return response()->json(
                [
                    "message" =>
                        "Administrators cannot delete their own accounts.",
                ],
                403,
            );
        }

        // isto é um soft delete bacalhau, não te stresses
        $user->delete();

        return response()->json([
            "message" => "Account deleted successfully.",
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            "message" => "Logged out successfully",
        ]);
    }
}
