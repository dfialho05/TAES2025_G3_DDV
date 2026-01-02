<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @var UserService
     */
    protected UserService $userService;

    /**
     * AuthController constructor.
     *
     * @param UserService $userService
     */
    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Authenticate user and return token
     *
     * @param Request $request
     * @return JsonResponse
     * @throws ValidationException
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            "email" => "required|email",
            "password" => "required",
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                "email" => ["Credenciais incorretas."],
            ]);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->isBlocked()) {
            Auth::logout();
            return response()->json(["message" => "Conta bloqueada."], 403);
        }

        // Criar token API para WebSocket authentication
        // Revoke all existing tokens to ensure only one active session
        $user->tokens()->delete();

        // Create token with 'ws' ability and 30-minute expiration
        $tokenResult = $user->createToken("websocket-token", ["ws"]);
        $tokenResult->accessToken->expires_at = now()->addMinutes(30);
        $tokenResult->accessToken->save();
        $token = $tokenResult->plainTextToken;

        // Regenerar session ID para segurança (apenas se sessão estiver disponível)
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            "user" => new UserResource($user),
            "token" => $token,
            "message" => "Bem-vindo!",
        ]);
    }

    /**
     * Logout user and revoke token
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke all API tokens
        /** @var \App\Models\User|null $user */
        $user = $request->user();
        if ($user) {
            $user->tokens()->delete();
        }

        Auth::guard("web")->logout();

        // Invalidar sessão (apenas se existir)
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(["message" => "Logout ok"]);
    }

    /**
     * Create a short-lived API token for the authenticated session user.
     *
     * This endpoint is intended for clients that have authenticated via session/cookie
     * and need a Bearer token for server-to-server or WebSocket exchanges.
     *
     * The token created will be scoped with a minimal ability ('ws') — callers
     * should validate token abilities where appropriate.
     *
     * Endpoint: POST /api/token (you will need to register a route if required)
     */
    public function createApiToken(Request $request): JsonResponse
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json(["message" => "Unauthenticated."], 401);
        }

        // Optionally revoke previous websocket tokens to limit active tokens
        // $user->tokens()->where('name', 'websocket-token')->delete();

        // Create a new token with a limited ability 'ws' and 30-minute expiration
        $tokenResult = $user->createToken("websocket-token", ["ws"]);
        $tokenResult->accessToken->expires_at = now()->addMinutes(30);
        $tokenResult->accessToken->save();
        $token = $tokenResult->plainTextToken;

        return response()->json([
            "token" => $token,
            "message" => "API token created.",
        ]);
    }

    /**
     * Register a new user
     *
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $user = $this->userService->register($request->validated());

            // Fazer login automático após registo
            Auth::login($user);

            // Criar token API para WebSocket authentication with 'ws' ability and 30-minute expiration
            $tokenResult = $user->createToken("websocket-token", ["ws"]);
            $tokenResult->accessToken->expires_at = now()->addMinutes(30);
            $tokenResult->accessToken->save();
            $token = $tokenResult->plainTextToken;

            // Regenerar session ID para segurança (apenas se sessão estiver disponível)
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            return response()->json(
                [
                    "user" => new UserResource($user),
                    "token" => $token,
                    "message" =>
                        "Registration successful! Welcome bonus of 10 coins has been credited to your account.",
                ],
                201,
            );
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => "Registration failed. Please try again.",
                    "error" => config("app.debug") ? $e->getMessage() : null,
                ],
                500,
            );
        }
    }

    /**
     * Update authenticated user's profile
     *
     * @param UpdateProfileRequest $request
     * @return UserResource
     */
    public function updateProfile(UpdateProfileRequest $request): UserResource
    {
        $user = $this->userService->updateProfile(
            $request->user(),
            $request->validated(),
        );

        return new UserResource($user);
    }

    /**
     * Delete authenticated user's account
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $request->validate([
            "current_password" => ["required", "string"],
        ]);

        try {
            $this->userService->deleteAccount(
                $request->user(),
                $request->input("current_password"),
            );

            // Invalidar sessão (apenas se existir)
            Auth::guard("web")->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                "message" => "Account deleted successfully.",
            ]);
        } catch (ValidationException $e) {
            return response()->json(
                [
                    "message" => $e->getMessage(),
                    "errors" => $e->errors(),
                ],
                422,
            );
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => $e->getMessage(),
                ],
                403,
            );
        }
    }

    /**
     * Get authenticated user
     *
     * @param Request $request
     * @return UserResource
     */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
