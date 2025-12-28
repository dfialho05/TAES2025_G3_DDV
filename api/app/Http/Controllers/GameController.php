<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreGameRequest;
use App\Http\Resources\GameResource;
use Carbon\Carbon;
use Illuminate\Http\Request;

class GameController extends Controller
{
    public function index()
    {
        return GameResource::collection(Game::all());
    }
    public function show(Game $game)
    {
        return new GameResource($game);
    }

    /**
     * CRIAR JOGO SOLTO (Standalone) OU ASSOCIADO
     * Endpoint: POST /api/games
     */
    public function store(StoreGameRequest $request)
    {
        try {
            // Impedir que administradores criem jogos
            $authUser = $request->user();
            if (
                $authUser &&
                isset($authUser->type) &&
                $authUser->type === "A"
            ) {
                Log::warning(
                    "[GameController] Admin attempted to create a game",
                    [
                        "user_id" => $authUser->id ?? null,
                    ],
                );
                return response()->json(
                    [
                        "message" =>
                            "Acesso negado. Administradores não podem criar jogos.",
                    ],
                    403,
                );
            }

            $validated = $request->validated();

            // Se for Standalone (sem match_id), garantimos que é NULL
            if (!isset($validated["match_id"])) {
                $validated["match_id"] = null;
            }

            // Define timestamps
            if (
                isset($validated["status"]) &&
                $validated["status"] === "Playing"
            ) {
                $validated["began_at"] = Carbon::now();
            }

            $game = Game::create($validated);

            Log::info("[GameController] Standalone/Linked Game created", [
                "id" => $game->id,
                "match_id" => $game->match_id,
            ]);

            return response()->json(new GameResource($game), 201);
        } catch (\Exception $e) {
            Log::error("Error creating game: " . $e->getMessage());
            return response()->json(
                [
                    "message" => "Error creating game",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    /**
     * CRIAR JOGO DENTRO DE UMA MATCH (Helper específico)
     * Endpoint: POST /api/matches/{id}/games
     */
    public function createGameForMatch(
        StoreGameRequest $request,
        $matchId,
    ): JsonResponse {
        // ... (Este método mantém-se igual ao que te dei antes, pois é específico para Matches)
        // Apenas para referência, garante que ele existe aqui.
        try {
            // Impedir que administradores criem jogos dentro de uma match
            $authUser = $request->user();
            if (
                $authUser &&
                isset($authUser->type) &&
                $authUser->type === "A"
            ) {
                Log::warning(
                    "[GameController] Admin attempted to create a game for match",
                    [
                        "user_id" => $authUser->id ?? null,
                        "match_id" => $matchId,
                    ],
                );
                return response()->json(
                    [
                        "message" =>
                            "Acesso negado. Administradores não podem criar jogos em partidas.",
                    ],
                    403,
                );
            }

            $match = Matches::find($matchId);
            if (!$match) {
                return response()->json(["message" => "Match not found"], 404);
            }

            $validated = $request->validated();
            $validated["match_id"] = $matchId;
            $validated["player1_user_id"] = $match->player1_user_id;
            $validated["player2_user_id"] = $match->player2_user_id;
            $validated["type"] = $match->type;

            if ($validated["status"] === "Playing") {
                $validated["began_at"] = Carbon::now();
            }

            $game = Game::create($validated);
            return response()->json(new GameResource($game), 201);
        } catch (\Exception $e) {
            return response()->json(["message" => "Error creating game"], 500);
        }
    }

    /**
     * FINALIZAR JOGO (Serve para ambos os casos)
     */
    public function finishGame(Request $request, $id): JsonResponse
    {
        try {
            $game = Game::find($id);
            if (!$game) {
                return response()->json(["message" => "Game not found"], 404);
            }

            $validated = $request->validate([
                "winner_user_id" => "nullable|integer",
                "player1_points" => "required|integer|min:0",
                "player2_points" => "required|integer|min:0",
                "is_draw" => "sometimes|boolean",
            ]);

            DB::beginTransaction();

            $endTime = Carbon::now();
            $totalTime = $game->began_at
                ? $endTime->diffInSeconds($game->began_at)
                : 0;

            // Lógica do Perdedor
            $loserId = null;
            if ($validated["winner_user_id"]) {
                $loserId =
                    $validated["winner_user_id"] == $game->player1_user_id
                        ? $game->player2_user_id
                        : $game->player1_user_id;
            }

            $game->update([
                "status" => "Ended",
                "winner_user_id" => $validated["winner_user_id"],
                "loser_user_id" => $loserId,
                "player1_points" => $validated["player1_points"],
                "player2_points" => $validated["player2_points"],
                "ended_at" => $endTime,
                "total_time" => $totalTime,
                "is_draw" => is_null($validated["winner_user_id"]),
            ]);

            DB::commit();

            return response()->json([
                "message" => "Game finished",
                "game" => $game,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error finishGame: " . $e->getMessage());
            return response()->json(
                ["message" => "Failed to finish game"],
                500,
            );
        }
    }

    /**
     * MÉTODO OTIMIZADO: Últimos 10 jogos para o perfil
     * Endpoint: GET /users/{id}/games/recent
     *
     * Este método é otimizado para a página de perfil com dados essenciais
     */
    public function recentGames(Request $request, $id): JsonResponse
    {
        try {
            // Try to find the user normally. If not found and the requester is an admin,
            // allow admins to fetch data for soft-deleted (trashed) users by loading withTrashed().
            $user = User::find($id);
            if (!$user) {
                $authUser = $request->user();
                if ($authUser && $authUser->type === "A") {
                    $user = User::withTrashed()->find($id);
                }
            }
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            $games = Game::with([
                "player1:id,name,nickname,photo_avatar_filename",
                "player2:id,name,nickname,photo_avatar_filename",
                "winner:id,name,nickname",
                "match:id,type",
            ])
                ->where(function ($q) use ($id) {
                    $q->where("player1_user_id", $id)->orWhere(
                        "player2_user_id",
                        $id,
                    );
                })
                ->where("status", "Ended") // Apenas jogos terminados
                ->orderBy("began_at", "desc") // Mais recentes primeiro
                ->limit(10) // OTIMIZAÇÃO: Apenas os 10 mais recentes
                ->get()
                ->map(function ($game) use ($id) {
                    // Determinar oponente baseado no ID do utilizador
                    $opponent = null;
                    if ($game->player1_user_id == $id && $game->player2) {
                        $opponent = $game->player2;
                    } elseif ($game->player2_user_id == $id && $game->player1) {
                        $opponent = $game->player1;
                    }

                    Log::info(
                        "[GameController] Processing Game ID: {$game->id}",
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
                        "total_time" => $game->total_time,
                        "player1_points" => $game->player1_points,
                        "player2_points" => $game->player2_points,
                        "winner_user_id" => $game->winner_user_id,
                        "winner" => $game->winner,
                        "player1_user_id" => $game->player1_user_id,
                        "player2_user_id" => $game->player2_user_id,
                        "player1" => $game->player1,
                        "player2" => $game->player2,
                        "match_id" => $game->match_id,
                        "match" => $game->match,
                        "opponent" => $opponent
                            ? [
                                "id" => $opponent->id,
                                "name" => $opponent->name,
                                "nickname" => $opponent->nickname,
                                "photo_avatar_filename" =>
                                    $opponent->photo_avatar_filename,
                            ]
                            : null,
                        "is_winner" =>
                            $game->winner_user_id === null
                                ? null
                                : $game->winner_user_id == $id,
                        "is_draw" => $game->is_draw,
                    ];
                });

            Log::info("[GameController] Recent Games processed", [
                "user_id" => $id,
                "total_games" => $games->count(),
                "games_with_opponents" => $games
                    ->filter(function ($g) {
                        return $g["opponent"] !== null;
                    })
                    ->count(),
            ]);

            return response()->json($games);
        } catch (\Exception $e) {
            Log::error("[GameController] Error in recentGames", [
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
     * HISTÓRICO COMPLETO DE JOGOS COM PAGINAÇÃO
     * Endpoint: GET /users/{id}/games
     */
    public function getAllUserGames(Request $request, $id): JsonResponse
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            $page = $request->input("page", 1);
            $limit = min($request->input("limit", 15), 50); // Máximo 50 por página

            $games = Game::with([
                "player1:id,name,nickname,photo_avatar_filename",
                "player2:id,name,nickname,photo_avatar_filename",
                "winner:id,name,nickname",
                "match:id,type",
            ])
                ->where(function ($q) use ($id) {
                    $q->where("player1_user_id", $id)->orWhere(
                        "player2_user_id",
                        $id,
                    );
                })
                ->where("status", "Ended")
                ->orderBy("began_at", "desc")
                ->paginate($limit, ["*"], "page", $page);

            // Processar os dados da mesma forma que recentGames
            $games->getCollection()->transform(function ($game) use ($id) {
                $opponent = null;
                if ($game->player1_user_id == $id && $game->player2) {
                    $opponent = $game->player2;
                } elseif ($game->player2_user_id == $id && $game->player1) {
                    $opponent = $game->player1;
                }

                return [
                    "id" => $game->id,
                    "type" => $game->type ?? "Standard",
                    "status" => $game->status,
                    "began_at" => $game->began_at,
                    "ended_at" => $game->ended_at,
                    "total_time" => $game->total_time,
                    "player1_points" => $game->player1_points,
                    "player2_points" => $game->player2_points,
                    "winner_user_id" => $game->winner_user_id,
                    "winner" => $game->winner,
                    "player1_user_id" => $game->player1_user_id,
                    "player2_user_id" => $game->player2_user_id,
                    "player1" => $game->player1,
                    "player2" => $game->player2,
                    "match_id" => $game->match_id,
                    "match" => $game->match,
                    "opponent" => $opponent
                        ? [
                            "id" => $opponent->id,
                            "name" => $opponent->name,
                            "nickname" => $opponent->nickname,
                            "photo_avatar_filename" =>
                                $opponent->photo_avatar_filename,
                        ]
                        : null,
                    "is_winner" =>
                        $game->winner_user_id === null
                            ? null
                            : $game->winner_user_id == $id,
                    "is_draw" => $game->is_draw,
                ];
            });

            return response()->json($games);
        } catch (\Exception $e) {
            Log::error("[GameController] Error in getAllUserGames", [
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
     * ESTATÍSTICAS DE JOGOS DO UTILIZADOR
     * Endpoint: GET /users/{id}/games/stats
     */
    public function userStats(Request $request, $id): JsonResponse
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(["message" => "User not found"], 404);
            }

            // Consulta base para jogos do utilizador
            $baseQuery = Game::where(function ($q) use ($id) {
                $q->where("player1_user_id", $id)->orWhere(
                    "player2_user_id",
                    $id,
                );
            })->where("status", "Ended");

            // Estatísticas básicas
            $totalGames = $baseQuery->count();
            $wonGames = (clone $baseQuery)
                ->where("winner_user_id", $id)
                ->count();
            $drawnGames = (clone $baseQuery)->where("is_draw", true)->count();
            $lostGames = $totalGames - $wonGames - $drawnGames;

            // Pontos totais
            $totalPoints = $baseQuery->sum(
                DB::raw(
                    "CASE
                    WHEN player1_user_id = {$id} THEN player1_points
                    WHEN player2_user_id = {$id} THEN player2_points
                    ELSE 0
                END",
                ),
            );

            // Capotes (wins with 91-119 points)
            $capotes = (clone $baseQuery)
                ->where("winner_user_id", $id)
                ->where(
                    DB::raw(
                        "CASE
                        WHEN player1_user_id = {$id} THEN player1_points
                        WHEN player2_user_id = {$id} THEN player2_points
                        ELSE 0
                    END",
                    ),
                    ">=",
                    91,
                )
                ->where(
                    DB::raw(
                        "CASE
                        WHEN player1_user_id = {$id} THEN player1_points
                        WHEN player2_user_id = {$id} THEN player2_points
                        ELSE 0
                    END",
                    ),
                    "<=",
                    119,
                )
                ->count();

            // Bandeiras (wins with 120+ points)
            $bandeiras = (clone $baseQuery)
                ->where("winner_user_id", $id)
                ->where(
                    DB::raw(
                        "CASE
                        WHEN player1_user_id = {$id} THEN player1_points
                        WHEN player2_user_id = {$id} THEN player2_points
                        ELSE 0
                    END",
                    ),
                    ">=",
                    120,
                )
                ->count();

            // Tempo total de jogo (em segundos)
            $totalTime = $baseQuery->sum("total_time") ?? 0;

            // Última atividade
            $lastGame = (clone $baseQuery)
                ->orderBy("began_at", "desc")
                ->first();
            $lastActivity = $lastGame ? $lastGame->began_at : null;

            // Taxa de vitórias
            $winRate =
                $totalGames > 0 ? round(($wonGames / $totalGames) * 100, 2) : 0;

            $stats = [
                "total_games" => $totalGames,
                "won_games" => $wonGames,
                "lost_games" => $lostGames,
                "drawn_games" => $drawnGames,
                "win_rate" => $winRate,
                "total_points" => $totalPoints,
                "total_time" => $totalTime,
                "average_points_per_game" =>
                    $totalGames > 0 ? round($totalPoints / $totalGames, 2) : 0,
                "average_time_per_game" =>
                    $totalGames > 0 ? round($totalTime / $totalGames, 2) : 0,
                "last_activity" => $lastActivity,
                "capotes" => $capotes,
                "bandeiras" => $bandeiras,
            ];

            Log::info("[GameController] User stats calculated", [
                "user_id" => $id,
                "stats" => $stats,
            ]);

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error("[GameController] Error in userStats", [
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
     * INICIAR JOGO
     * Endpoint: POST /games/{id}/start
     */
    public function startGame(Request $request, $id): JsonResponse
    {
        try {
            // Impedir que administradores entrem/iniciem jogos
            $authUser = $request->user();
            if (
                $authUser &&
                isset($authUser->type) &&
                $authUser->type === "A"
            ) {
                Log::warning(
                    "[GameController] Admin attempted to start a game",
                    [
                        "user_id" => $authUser->id ?? null,
                        "game_id" => $id,
                    ],
                );
                return response()->json(
                    [
                        "message" =>
                            "Acesso negado. Administradores não podem entrar/iniciar jogos.",
                    ],
                    403,
                );
            }

            $game = Game::find($id);
            if (!$game) {
                return response()->json(["message" => "Game not found"], 404);
            }

            $game->update([
                "status" => "Playing",
                "began_at" => Carbon::now(),
            ]);

            Log::info("[GameController] Game started", [
                "game_id" => $game->id,
                "began_at" => $game->began_at,
            ]);

            return response()->json([
                "message" => "Game started",
                "game" => new GameResource($game),
            ]);
        } catch (\Exception $e) {
            Log::error("[GameController] Error starting game", [
                "game_id" => $id,
                "error" => $e->getMessage(),
            ]);

            return response()->json(["message" => "Failed to start game"], 500);
        }
    }

    /**
     * BUSCAR JOGOS POR PARTIDA
     * Endpoint: GET /matches/{matchId}/games
     */
    public function gamesByMatch(Request $request, $matchId): JsonResponse
    {
        try {
            $match = Matches::find($matchId);
            if (!$match) {
                return response()->json(["message" => "Match not found"], 404);
            }

            $games = Game::with([
                "player1:id,name,nickname,photo_avatar_filename",
                "player2:id,name,nickname,photo_avatar_filename",
                "winner:id,name,nickname",
            ])
                ->where("match_id", $matchId)
                ->orderBy("began_at", "asc")
                ->get()
                ->map(function ($game) {
                    return [
                        "id" => $game->id,
                        "type" => $game->type ?? "Standard",
                        "status" => $game->status,
                        "began_at" => $game->began_at,
                        "ended_at" => $game->ended_at,
                        "total_time" => $game->total_time,
                        "player1_points" => $game->player1_points,
                        "player2_points" => $game->player2_points,
                        "winner_user_id" => $game->winner_user_id,
                        "winner" => $game->winner,
                        "player1_user_id" => $game->player1_user_id,
                        "player2_user_id" => $game->player2_user_id,
                        "player1" => $game->player1,
                        "player2" => $game->player2,
                        "is_draw" => $game->is_draw,
                    ];
                });

            return response()->json($games);
        } catch (\Exception $e) {
            Log::error("[GameController] Error in gamesByMatch", [
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
}
