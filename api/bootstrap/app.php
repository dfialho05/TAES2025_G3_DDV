<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . "/../routes/web.php",
        api: __DIR__ . "/../routes/api.php",
        commands: __DIR__ . "/../routes/console.php",
        health: "/up",
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Ativa o suporte para cookies na API (Sanctum)
        $middleware->statefulApi();

        // Exceções de CSRF para rotas de autenticação
        $middleware->validateCsrfTokens(except: ["api/login", "api/register"]);

        $middleware->alias([
            "admin" => \App\Http\Middleware\AdminMiddleware::class,
            "ws.token" => \App\Http\Middleware\WebSocketTokenMiddleware::class,
            "abilities" =>
                \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            "ability" =>
                \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
        ]);

        // Aplica o throttle às rotas para proteção DDoS
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
