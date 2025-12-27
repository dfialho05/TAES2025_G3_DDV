<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar se o usuário está autenticado
        if (!auth()->check()) {
            return response()->json(
                [
                    "message" => "Não autenticado",
                ],
                401,
            );
        }

        // Verificar se o usuário é admin
        if (!auth()->user()->isType("A")) {
            return response()->json(
                [
                    "message" =>
                        "Acesso negado. Apenas administradores podem acessar este recurso.",
                ],
                403,
            );
        }

        return $next($request);
    }
}
