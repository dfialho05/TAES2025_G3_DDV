<?php

namespace App\Http\Controllers;

use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MatchController extends Controller
{
    /**
     * Lista completa de partidas (apenas para Admin)
     */
    public function index(): JsonResponse
    {
        $matches = Matches::with([
            "player1:id,name,nickname,photo_avatar_filename",
            "player2:id,name,nickname,photo_avatar_filename",
            "winner:id,name,nickname",
        ])
            ->latest()
            ->paginate(20);

        return response()->json($matches);
    }

    /**
     * Histórico pessoal do utilizador autenticado
     * Endpoint: GET /matches/me
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $matches = Matches::with([
            "player1:id,name,nickname,photo_avatar_filename",
            "player2:id,name,nickname,photo_avatar_filename",
            "winner:id,name,nickname",
            "games",
        ])
            ->where(function ($q) use ($user) {
                $q->where("layer1_user_id", $user->id)->orWhere(
                    "player2_user_id",
                    $user->id,
                );
            })
            ->orderBy("began_at", "desc")
            ->paginate(15);

        return response()->json($matches);
    }

    /**
     * MÉTODO ORIGINAL: Partidas de um utilizador específico (com paginação)
     * Endpoint: GET /matches/user/{id}
     * Mantido para compatibilidade, mas com correções
     */
    public function matchesByUser(Request $request, $id): JsonResponse
    {
        try {
            $targetUser = User::find($id);
            if (!$targetUser) {
                return response()->json(["message" => "User not found"], 404);
            }

            $matches = Matches::with([
                "player1:id,name,email,nickname,photo_avatar_filename",
                "player2:id,name,email,nickname,photo_avatar_filename",
                "winner:id,name,nickname",
                "games",
                "games.winner:id,name,nickname",
            ])
                ->where(function ($q) use ($id) {
                    $q->where("layer1_user_id", $id)->orWhere(
                        "player2_user_id",
                        $id,
                    );
                })
                ->orderBy("began_at", "desc")
                ->paginate(15);

            return response()->json($matches);
        } catch (\Exception $e) {
            Log::error("❌ [MatchController] Error in matchesByUser", [
                "user_id" => $id,
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                [
                    "message" => "Erro interno do servidor",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    /**
     * NOVO MÉTODO OTIMIZADO: Últimas 5 partidas para o perfil
     * Endpoint: GET /users/{id}/matches/recent
     *
     * Este método é otimizado para a página de perfil com dados essenciais
     */
    public function recentMatches(Request $request, $id): JsonResponse
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            $matches = Matches::with([
                "player1:id,name,nickname,photo_avatar_filename",
                "player2:id,name,nickname,photo_avatar_filename",
                "winner:id,name,nickname",
                "games" => function ($query) {
                    // Eager load dos jogos com dados essenciais
                    $query
                        ->with("winner:id,name,nickname")
                        ->orderBy("began_at", "asc"); // Ordem cronológica dentro da partida
                },
            ])
                ->where(function ($q) use ($id) {
                    $q->where("layer1_user_id", $id)->orWhere(
                        "player2_user_id",
                        $id,
                    );
                })
                ->where("status", "Ended") // Apenas partidas terminadas
                ->orderBy("began_at", "desc") // Mais recentes primeiro
                ->limit(5) // OTIMIZAÇÃO: Apenas as 5 mais recentes
                ->get()
                ->map(function ($match) use ($id) {
                    // Determinar oponente baseado no ID do utilizador
                    $opponent = null;
                    if ($match->layer1_user_id == $id && $match->player2) {
                        $opponent = $match->player2;
                    } elseif (
                        $match->player2_user_id == $id &&
                        $match->player1
                    ) {
                        $opponent = $match->player1;
                    }

                    // Log detalhado da partida processada
                    Log::info(
                        "🏆 [MatchController] Processing Match ID: {$match->id}",
                        [
                            "layer1_user_id" => $match->layer1_user_id,
                            "player2_user_id" => $match->player2_user_id,
                            "winner_user_id" => $match->winner_user_id,
                            "user_id" => $id,
                            "opponent_found" => $opponent
                                ? $opponent->name
                                : "null",
                            "games_count" => $match->games->count(),
                        ],
                    );

                    return [
                        "id" => $match->id,
                        "type" => $match->type ?? "Standard",
                        "status" => $match->status,
                        "began_at" => $match->began_at,
                        "ended_at" => $match->ended_at,
                        "total_time" => $match->total_time,
                        "player1_marks" => $match->player1_marks,
                        "player2_marks" => $match->player2_marks,
                        "winner_user_id" => $match->winner_user_id,
                        "winner" => $match->winner,
                        "layer1_user_id" => $match->layer1_user_id,
                        "player2_user_id" => $match->player2_user_id,
                        "opponent" => $opponent
                            ? [
                                "id" => $opponent->id,
                                "name" => $opponent->name,
                                "nickname" => $opponent->nickname,
                                "photo_avatar_filename" =>
                                    $opponent->photo_avatar_filename,
                            ]
                            : null,
                        "is_winner" => $match->winner_user_id == $id,
                        "games" => $match->games->map(function ($game) use (
                            $id,
                        ) {
                            return [
                                "id" => $game->id,
                                "type" => $game->type ?? "Standard",
                                "status" => $game->status,
                                "began_at" => $game->began_at,
                                "ended_at" => $game->ended_at,
                                "winner_id" => $game->winner_id,
                                "winner" => $game->winner,
                                "player1_id" => $game->player1_id,
                                "player2_id" => $game->player2_id,
                                "is_winner" => $game->winner_id == $id,
                            ];
                        }),
                        "games_count" => $match->games->count(),
                    ];
                });

            // Log final das partidas processadas
            Log::info("✅ [MatchController] Recent Matches processed", [
                "user_id" => $id,
                "total_matches" => $matches->count(),
                "matches_with_opponents" => $matches
                    ->filter(fn($m) => $m["opponent"] !== null)
                    ->count(),
            ]);

            return response()->json($matches);
        } catch (\Exception $e) {
            Log::error("❌ [MatchController] Error in recentMatches", [
                "user_id" => $id,
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                [
                    "message" => "Erro interno do servidor",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    /**
     * Detalhes de uma partida específica
     * Endpoint: GET /matches/{id}
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $match = Matches::with([
            "player1:id,name,email,nickname,photo_avatar_filename",
            "player2:id,name,email,nickname,photo_avatar_filename",
            "winner:id,name,nickname",
            "games" => function ($query) {
                $query
                    ->with([
                        "player1:id,name,nickname",
                        "player2:id,name,nickname",
                        "winner:id,name,nickname",
                    ])
                    ->orderBy("began_at", "asc");
            },
        ])->find($id);

        if (!$match) {
            return response()->json(["message" => "Match not found"], 404);
        }

        // Verificação de segurança: Admin ou Participante
        $isParticipant = $match->hasPlayer($user->id);
        $isAdmin = $user->type === "A";

        if (!$isAdmin && !$isParticipant) {
            return response()->json(
                ["message" => "Unauthorized access to this match."],
                403,
            );
        }

        return response()->json($match);
    }

    /**
     * Criar uma nova partida
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "type" => "required|string",
            "layer1_user_id" => "required|integer|exists:users,id",
            "player2_user_id" => "required|integer|exists:users,id",
            "stake" => "nullable|numeric|min:0",
        ]);

        $match = new Matches($validated);
        $match->save();

        return response()->json(
            $match->load([
                "player1:id,name,nickname",
                "player2:id,name,nickname",
            ]),
            201,
        );
    }

    /**
     * Atualizar uma partida
     */
    public function update(Request $request, $id): JsonResponse
    {
        $match = Matches::where("id", $id)->first();
        if (!$match) {
            return response()->json(["message" => "Match not found"], 404);
        }

        $user = $request->user();
        $isParticipant = $match->hasPlayer($user->id);
        $isAdmin = $user->type === "A";

        if (!$isAdmin && !$isParticipant) {
            return response()->json(["message" => "Unauthorized"], 403);
        }

        $validated = $request->validate([
            "status" => "sometimes|string",
            "winner_user_id" => "sometimes|integer|exists:users,id",
            "loser_user_id" => "sometimes|integer|exists:users,id",
            "ended_at" => "sometimes|date",
            "total_time" => "sometimes|integer",
            "player1_marks" => "sometimes|integer",
            "player2_marks" => "sometimes|integer",
        ]);

        $match->update($validated);

        return response()->json(
            $match->fresh([
                "player1:id,name,nickname",
                "player2:id,name,nickname",
                "winner:id,name,nickname",
            ]),
        );
    }

    /**
     * Eliminar uma partida (apenas Admin)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if ($user->type !== "A") {
            return response()->json(
                ["message" => "Admin access required"],
                403,
            );
        }

        $match = Matches::where("id", $id)->first();
        if (!$match) {
            return response()->json(["message" => "Match not found"], 404);
        }

        $match->delete();

        return response()->json(["message" => "Match deleted successfully"]);
    }

    /**
     * Estatísticas rápidas de partidas de um utilizador
     */
    public function userStats(Request $request, $id): JsonResponse
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            $totalMatches = Matches::where(function ($q) use ($id) {
                $q->where("layer1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })->count();

            $wonMatches = Matches::where(function ($q) use ($id) {
                $q->where("layer1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })
                ->where("winner_user_id", $id)
                ->count();

            $lostMatches = $totalMatches - $wonMatches;
            $winRate =
                $totalMatches > 0
                    ? round(($wonMatches / $totalMatches) * 100, 2)
                    : 0;

            $lastMatch = Matches::where(function ($q) use ($id) {
                $q->where("layer1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })
                ->orderBy("began_at", "desc")
                ->first(["id", "began_at", "status"]);

            return response()->json([
                "user_id" => $id,
                "total_matches" => $totalMatches,
                "won_matches" => $wonMatches,
                "lost_matches" => $lostMatches,
                "win_rate" => $winRate,
                "last_match" => $lastMatch,
            ]);
        } catch (\Exception $e) {
            Log::error("❌ [MatchController] Error in userStats", [
                "user_id" => $id,
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                [
                    "message" => "Erro interno do servidor",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }
}
