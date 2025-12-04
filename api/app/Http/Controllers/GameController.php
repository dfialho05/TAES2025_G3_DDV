<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use App\Models\Matches;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\StoreGameRequest;
use App\Http\Resources\GameResource;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return GameResource::collection(Game::all());
    }

    /**
     * NOVO MÉTODO OTIMIZADO: Últimos 10 jogos de um utilizador
     * Endpoint: GET /users/{id}/games/recent
     *
     * Esta função substitui recentGamesByUser e é otimizada para o perfil
     */
    public function recentGames(Request $request, $id): JsonResponse
    {
        try {
            // Verificar se o utilizador existe
            $user = User::find($id);
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            // Buscar apenas os 10 jogos mais recentes com eager loading otimizado
            $games = Game::with([
                "player1:id,name,nickname,photo_avatar_filename",
                "player2:id,name,nickname,photo_avatar_filename",
                "winner:id,name,nickname",
            ])
                ->where(function ($q) use ($id) {
                    $q->where("player1_user_id", $id)->orWhere(
                        "player2_user_id",
                        $id,
                    );
                })
                ->orderBy("began_at", "desc")
                ->limit(10) // OTIMIZAÇÃO: Limitar a 10 registos
                ->get()
                ->map(function ($game) use ($id) {
                    // Determinar oponente baseado no ID do utilizador
                    $opponent = null;
                    if ($game->player1_user_id == $id && $game->player2) {
                        $opponent = $game->player2;
                    } elseif ($game->player2_user_id == $id && $game->player1) {
                        $opponent = $game->player1;
                    }

                    // Log detalhado do jogo processado
                    Log::info(
                        "🎮 [GameController] Processing Game ID: {$game->id}",
                        [
                            "player1_user_id" => $game->player1_user_id,
                            "player2_user_id" => $game->player2_user_id,
                            "winner_user_id" => $game->winner_user_id,
                            "user_id" => $id,
                            "opponent_found" => $opponent
                                ? $opponent->name
                                : "null",
                        ],
                    );

                    return [
                        "id" => $game->id,
                        "type" => $game->type ?? "Standard",
                        "status" => $game->status,
                        "began_at" => $game->began_at,
                        "ended_at" => $game->ended_at,
                        "winner_id" => $game->winner_user_id,
                        "winner" => $game->winner,
                        "player1_id" => $game->player1_user_id,
                        "player2_id" => $game->player2_user_id,
                        "opponent" => $opponent
                            ? [
                                "id" => $opponent->id,
                                "name" => $opponent->name,
                                "nickname" => $opponent->nickname,
                                "photo_avatar_filename" =>
                                    $opponent->photo_avatar_filename,
                            ]
                            : null,
                        "is_winner" => $game->winner_user_id == $id,
                        "match_id" => $game->match_id,
                    ];
                });

            // Log final dos jogos processados
            Log::info("✅ [GameController] Recent Games processed", [
                "user_id" => $id,
                "total_games" => $games->count(),
                "games_with_opponents" => $games
                    ->filter(fn($g) => $g["opponent"] !== null)
                    ->count(),
            ]);

            return response()->json($games);
        } catch (\Exception $e) {
            Log::error("❌ [GameController] Error in recentGames", [
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
     * MÉTODO MANTIDO para compatibilidade (se usado noutras partes)
     * @deprecated Use recentGames() instead
     */
    public function recentGamesByUser(Request $request, $id)
    {
        return $this->recentGames($request, $id);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGameRequest $request)
    {
        $game = new Game($request->validated());
        $game->save();
        return new GameResource($game);
    }

    /**
     * Display the specified resource.
     */
    public function show(Game $game)
    {
        return new GameResource($game);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreGameRequest $request, Game $game)
    {
        $game->update($request->validated());
        return new GameResource($game);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        $game->delete();
        return response()->json(["message" => "Game deleted successfully"]);
    }

    /**
     * Método auxiliar para jogos de uma partida específica
     */
    public function gamesByMatch(Request $request, $matchId): JsonResponse
    {
        try {
            $user = $request->user();

            // Verificar se a partida existe e se o utilizador tem acesso
            $match = Matches::find($matchId);
            if (!$match) {
                return response()->json(["message" => "Match not found"], 404);
            }

            // Verificar permissões (admin ou participante)
            $isParticipant =
                $match->player1_user_id === $user->id ||
                $match->player2_user_id === $user->id;
            $isAdmin = $user->type === "A";

            if (!$isAdmin && !$isParticipant) {
                return response()->json(
                    [
                        "message" => "Unauthorized access to this match games.",
                    ],
                    403,
                );
            }

            $games = Game::with([
                "player1:id,name,nickname",
                "player2:id,name,nickname",
                "winner:id,name,nickname",
            ])
                ->where("match_id", $matchId)
                ->orderBy("began_at", "desc")
                ->get();

            return response()->json($games);
        } catch (\Exception $e) {
            Log::error("❌ [GameController] Error in gamesByMatch", [
                "match_id" => $matchId,
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
     * Estatísticas rápidas de jogos de um utilizador
     */
    public function userStats(Request $request, $id): JsonResponse
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            $totalGames = Game::where(function ($q) use ($id) {
                $q->where("player1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })->count();

            $wonGames = Game::where(function ($q) use ($id) {
                $q->where("player1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })
                ->where("winner_user_id", $id)
                ->count();

            $lostGames = $totalGames - $wonGames;
            $winRate =
                $totalGames > 0 ? round(($wonGames / $totalGames) * 100, 2) : 0;

            $lastGame = Game::where(function ($q) use ($id) {
                $q->where("player1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })
                ->orderBy("began_at", "desc")
                ->first(["id", "began_at", "status"]);

            return response()->json([
                "user_id" => $id,
                "total_games" => $totalGames,
                "won_games" => $wonGames,
                "lost_games" => $lostGames,
                "win_rate" => $winRate,
                "last_game" => $lastGame,
            ]);
        } catch (\Exception $e) {
            Log::error("❌ [GameController] Error in userStats", [
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
