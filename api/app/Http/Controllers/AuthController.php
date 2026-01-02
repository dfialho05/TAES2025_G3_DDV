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

        $user = Auth::user();

        if ($user->isBlocked()) {
            Auth::logout();
            return response()->json(["message" => "Conta bloqueada."], 403);
        }

        // Regenerar session ID para segurança
        $request->session()->regenerate();

        return response()->json([
            "user" => new UserResource($user),
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
        Auth::guard("web")->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(["message" => "Logout ok"]);
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
            $request->session()->regenerate();

            return response()->json(
                [
                    "user" => new UserResource($user),
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

            // Invalidar sessão
            Auth::guard("web")->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

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
