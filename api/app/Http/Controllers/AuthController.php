<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
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

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            "message" => "Logged out successfully",
        ]);
    }

    public function register(Request $request)
    {
        // TODO: perguntar ao stor a melhor abordagem em questao ao registrar um usuario ja apagado
        // TODO: nao faz sentido o nickname poder ser igual a outro usuario mesmo que apagado
        $data = $request->validate([
            "name" => ["required", "string", "max:255"],
            "email" => [
                "required",
                "string",
                "email",
                "max:255",
                Rule::unique("users", "email")->where(function ($query) {
                    $query->whereNull("deleted_at");
                }),
            ],
            "password" => ["required", "string", "min:3"],
            "nickname" => [
                "sometimes",
                "nullable",
                "string",
                "max:20",
                "unique:users,nickname",
                // Rule::unique("users", "nickname")->where(function ($query) {
                //     $query->whereNull("deleted_at");
                // }),
            ],
            "photo_avatar_filename" => ["sometimes", "nullable", "string"],
        ]);

        // TODO: Se tiver tempo mudar esta estrutura para recuperar a conta soft deleted
        // Transação: se já existir um user soft-deleted com o mesmo email,
        // marca-o adicionando "?deleted" ao email antes do create, evitando conflito UNIQUE.
        $result = DB::transaction(function () use ($data) {
            // finds a soft-deleted user with this email
            $trashed = User::withTrashed()
                ->where("email", $data["email"])
                ->whereNotNull("deleted_at")
                ->first();

            if ($trashed) {
                // adds the "?deleted" suffix, keeping the rest of the email the same
                $trashed->email =
                    $trashed->email . "?deleted_newAccount:" . $trashed->id;
                $trashed->save();
            }
        });

        // creates the new user
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
                "user" => new UserResource($user),
            ],
            201,
        );
    }

    public function updateProfile(Request $request): JsonResponse
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

        return new UserResource($user);
    }

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

        // This is a soft delete, don't worry.
        $user->delete();

        return response()->json([
            "message" => "Account deleted successfully.",
        ]);
    }
}
