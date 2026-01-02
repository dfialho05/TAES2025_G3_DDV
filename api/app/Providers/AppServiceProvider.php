<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Observer existente
        User::observe(UserObserver::class);

        // 1. Limite para Autenticação (Login/Register)
        RateLimiter::for("auth", function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json(
                        [
                            "message" =>
                                "Acesso bloqueado por segurança devido ao excesso de pedidos (Anti-DDoS).",
                        ],
                        429,
                        $headers,
                    );
                });
        });

        // 2. Limite Geral para a API
        RateLimiter::for("api", function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip(),
            );
        });

        // 3. Limite para Ações de Jogo e Imagens
        RateLimiter::for("gameplay", function (Request $request) {
            return Limit::perMinute(150)->by(
                $request->user()?->id ?: $request->ip(),
            );
        });
    }
}
