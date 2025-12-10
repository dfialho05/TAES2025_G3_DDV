<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use App\Models\Matches;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreGameRequest;
use App\Http\Resources\GameResource;
use Carbon\Carbon;

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
                        "winner_id" => $game->winner_user_id,
                        "winner" => $game->winner,
                        "player1_id" => $game->player1_user_id,
                        "player2_id" => $game->player2_user_id,
                        "player1_points" => $game->player1_points,
                        "player2_points" => $game->player2_points,
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
                        "match_id" => $game->match_id,
                    ];
                });

            // Log final dos jogos processados
            Log::info("[GameController] Recent Games processed", [
                "user_id" => $id,
                "total_games" => $games->count(),
                "games_with_opponents" => $games
                    ->filter(fn($g) => $g["opponent"] !== null)
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
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // If status is Playing, set began_at
            if ($validated["status"] === "Playing") {
                $validated["began_at"] = Carbon::now();
            }

            $game = Game::create($validated);
            $game->load([
                "deck",
                "player1:id,name,nickname",
                "player2:id,name,nickname",
            ]);

            DB::commit();

            Log::info("[GameController] Game created successfully", [
                "game_id" => $game->id,
                "match_id" => $game->match_id,
                "player1_id" => $game->player1_user_id,
                "player2_id" => $game->player2_user_id,
                "type" => $game->type,
            ]);

            return new GameResource($game);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameController] Error creating game", [
                "error" => $e->getMessage(),
                "request_data" => $request->validated(),
            ]);

            return response()->json(
                [
                    "message" => "Failed to create game",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
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
        try {
            $validated = $request->validated();
            $user = $request->user();

            // Check authorization
            $isParticipant = $game->hasPlayer($user->id);
            $isAdmin = $user->type === "A";

            if (!$isAdmin && !$isParticipant) {
                return response()->json(["message" => "Unauthorized"], 403);
            }

            DB::beginTransaction();

            // Handle status changes with automatic timestamps
            if (isset($validated["status"])) {
                if (
                    $validated["status"] === "Playing" &&
                    $game->status === "Pending"
                ) {
                    $validated["began_at"] = Carbon::now();
                } elseif (
                    $validated["status"] === "Ended" &&
                    $game->status !== "Ended"
                ) {
                    $validated["ended_at"] = Carbon::now();

                    // Calculate total time if began_at exists
                    if ($game->began_at) {
                        $validated["total_time"] = Carbon::now()->diffInSeconds(
                            $game->began_at,
                        );
                    }
                }
            }

            $game->update($validated);

            DB::commit();

            Log::info("[GameController] Game updated successfully", [
                "game_id" => $game->id,
                "updated_fields" => array_keys($validated),
                "updated_by" => $user->id,
            ]);

            return new GameResource(
                $game->fresh(["deck", "player1", "player2", "winner"]),
            );
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameController] Error updating game", [
                "game_id" => $game->id,
                "error" => $e->getMessage(),
                "updated_by" => $request->user()?->id,
            ]);

            return response()->json(
                [
                    "message" => "Failed to update game",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
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
     * Create a game for a specific match
     */
    public function createGameForMatch(
        StoreGameRequest $request,
        $matchId,
    ): JsonResponse {
        try {
            $match = Matches::find($matchId);
            if (!$match) {
                return response()->json(["message" => "Match not found"], 404);
            }

            $user = $request->user();
            $isParticipant = $match->hasPlayer($user->id);
            $isAdmin = $user->type === "A";

            if (!$isAdmin && !$isParticipant) {
                return response()->json(["message" => "Unauthorized"], 403);
            }

            DB::beginTransaction();

            // Merge match_id into request data
            $validated = $request->validated();
            $validated["match_id"] = $matchId;

            // Ensure players match the match
            $validated["player1_user_id"] = $match->player1_user_id;
            $validated["player2_user_id"] = $match->player2_user_id;
            $validated["type"] = $match->type;

            // If status is Playing, set began_at
            if ($validated["status"] === "Playing") {
                $validated["began_at"] = Carbon::now();
            }

            $game = Game::create($validated);
            $game->load([
                "deck",
                "player1:id,name,nickname",
                "player2:id,name,nickname",
                "match:id,type,status",
            ]);

            DB::commit();

            Log::info("[GameController] Game created for match", [
                "game_id" => $game->id,
                "match_id" => $matchId,
                "created_by" => $user->id,
            ]);

            return response()->json($game, 201);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameController] Error creating game for match", [
                "match_id" => $matchId,
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                [
                    "message" => "Failed to create game for match",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    /**
     * Start a game
     */
    public function startGame(Request $request, $id): JsonResponse
    {
        try {
            $game = Game::find($id);
            if (!$game) {
                return response()->json(["message" => "Game not found"], 404);
            }

            $user = $request->user();
            $isParticipant = $game->hasPlayer($user->id);
            $isAdmin = $user->type === "A";

            if (!$isAdmin && !$isParticipant) {
                return response()->json(["message" => "Unauthorized"], 403);
            }

            if ($game->status !== "Pending") {
                return response()->json(
                    [
                        "message" =>
                            "Game cannot be started. Current status: " .
                            $game->status,
                    ],
                    400,
                );
            }

            DB::beginTransaction();

            $game->update([
                "status" => "Playing",
                "began_at" => Carbon::now(),
            ]);

            DB::commit();

            Log::info("[GameController] Game started", [
                "game_id" => $game->id,
                "started_by" => $user->id,
            ]);

            return response()->json([
                "message" => "Game started successfully",
                "game" => $game->fresh([
                    "player1:id,name,nickname",
                    "player2:id,name,nickname",
                ]),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameController] Error starting game", [
                "game_id" => $id,
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                [
                    "message" => "Failed to start game",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    /**
     * Finish a game
     */
    public function finishGame(Request $request, $id): JsonResponse
    {
        try {
            $game = Game::find($id);
            if (!$game) {
                return response()->json(["message" => "Game not found"], 404);
            }

            $user = $request->user();
            $isParticipant = $game->hasPlayer($user->id);
            $isAdmin = $user->type === "A";

            if (!$isAdmin && !$isParticipant) {
                return response()->json(["message" => "Unauthorized"], 403);
            }

            if ($game->status !== "Playing") {
                return response()->json(
                    [
                        "message" =>
                            "Game cannot be finished. Current status: " .
                            $game->status,
                    ],
                    400,
                );
            }

            $validated = $request->validate([
                "winner_user_id" => "nullable|integer|exists:users,id",
                "player1_points" => "sometimes|integer|min:0",
                "player2_points" => "sometimes|integer|min:0",
                "is_draw" => "sometimes|boolean",
            ]);

            DB::beginTransaction();

            $endTime = Carbon::now();
            $totalTime = $game->began_at
                ? $endTime->diffInSeconds($game->began_at)
                : null;

            $updateData = [
                "status" => "Ended",
                "ended_at" => $endTime,
                "total_time" => $totalTime,
                "player1_points" => $validated["player1_points"] ?? null,
                "player2_points" => $validated["player2_points"] ?? null,
                "is_draw" => $validated["is_draw"] ?? false,
            ];

            // Handle winner/loser only if not a draw
            if (
                !($validated["is_draw"] ?? false) &&
                isset($validated["winner_user_id"])
            ) {
                // Ensure winner is one of the players
                if (
                    !in_array($validated["winner_user_id"], [
                        $game->player1_user_id,
                        $game->player2_user_id,
                    ])
                ) {
                    return response()->json(
                        [
                            "message" =>
                                "Winner must be one of the game players",
                        ],
                        400,
                    );
                }

                $updateData["winner_user_id"] = $validated["winner_user_id"];
                $updateData["loser_user_id"] =
                    $validated["winner_user_id"] === $game->player1_user_id
                        ? $game->player2_user_id
                        : $game->player1_user_id;
            }

            $game->update($updateData);

            DB::commit();

            Log::info("[GameController] Game finished", [
                "game_id" => $game->id,
                "winner_id" => $updateData["winner_user_id"] ?? null,
                "is_draw" => $updateData["is_draw"],
                "finished_by" => $user->id,
            ]);

            return response()->json([
                "message" => "Game finished successfully",
                "game" => $game->fresh([
                    "player1:id,name,nickname",
                    "player2:id,name,nickname",
                    "winner:id,name,nickname",
                ]),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("[GameController] Error finishing game", [
                "game_id" => $id,
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                [
                    "message" => "Failed to finish game",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }
}
