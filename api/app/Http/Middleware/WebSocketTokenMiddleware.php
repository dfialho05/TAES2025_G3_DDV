<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to validate WebSocket API tokens.
 *
 * This middleware ensures that:
 * 1. The request is authenticated via Sanctum token (not session)
 * 2. The token has the 'ws' ability
 * 3. The token has not expired (30 minutes from creation)
 *
 * This is intended for routes that are called by the WebSocket server (Node.js)
 * to perform actions on behalf of users (e.g., creating matches, games, etc.)
 */
class WebSocketTokenMiddleware
{
    /**
     * Token lifetime in minutes.
     * After this time, tokens are considered expired and must be refreshed.
     */
    const TOKEN_LIFETIME_MINUTES = 30;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if user is authenticated
        $user = $request->user();

        if (!$user) {
            Log::warning("[WebSocket Token] Unauthenticated request attempt", [
                "ip" => $request->ip(),
                "path" => $request->path(),
                "method" => $request->method(),
            ]);
            return response()->json(
                [
                    "message" => "Unauthenticated.",
                    "error" => "No valid authentication token provided.",
                ],
                401,
            );
        }

        // 2. Check if the current token has the 'ws' ability
        if (!$request->user()->tokenCan("ws")) {
            Log::warning("[WebSocket Token] Token missing 'ws' ability", [
                "user_id" => $user->id,
                "user_name" => $user->name,
                "path" => $request->path(),
                "method" => $request->method(),
            ]);
            return response()->json(
                [
                    "message" => "Forbidden.",
                    "error" =>
                        "This token does not have the required 'ws' ability for WebSocket operations.",
                ],
                403,
            );
        }

        // 3. Check token expiration
        $currentToken = $request->user()->currentAccessToken();

        if (!$currentToken) {
            return response()->json(
                [
                    "message" => "Unauthorized.",
                    "error" => "Unable to verify token validity.",
                ],
                401,
            );
        }

        // Check if token has an explicit expires_at and if it's expired
        if (
            $currentToken->expires_at &&
            now()->isAfter($currentToken->expires_at)
        ) {
            Log::info("[WebSocket Token] Token expired (explicit expires_at)", [
                "user_id" => $user->id,
                "user_name" => $user->name,
                "token_created_at" => $currentToken->created_at,
                "token_expires_at" => $currentToken->expires_at,
                "path" => $request->path(),
            ]);
            return response()->json(
                [
                    "message" => "Token expired.",
                    "error" =>
                        "Your WebSocket token has expired. Please re-authenticate.",
                ],
                401,
            );
        }

        // Fallback: Check token age if expires_at is not set
        // (for backwards compatibility with tokens created before expiration was added)
        if (
            !$currentToken->expires_at &&
            $currentToken->created_at
                ->addMinutes(self::TOKEN_LIFETIME_MINUTES)
                ->isPast()
        ) {
            Log::info("[WebSocket Token] Token expired (age-based fallback)", [
                "user_id" => $user->id,
                "user_name" => $user->name,
                "token_created_at" => $currentToken->created_at,
                "token_age_minutes" => $currentToken->created_at->diffInMinutes(
                    now(),
                ),
                "path" => $request->path(),
            ]);
            return response()->json(
                [
                    "message" => "Token expired.",
                    "error" =>
                        "Your WebSocket token is too old. Please re-authenticate.",
                ],
                401,
            );
        }

        // Token is valid, proceed with request
        return $next($request);
    }
}
