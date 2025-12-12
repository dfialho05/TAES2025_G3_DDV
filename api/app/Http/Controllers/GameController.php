<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Matches;
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

    // Incluir os restantes métodos (recentGames, userStats, etc) do ficheiro anterior aqui...
    public function recentGames(Request $request, $id): JsonResponse { /* ... */ return response()->json([]); }
    public function getAllUserGames(Request $request, $id): JsonResponse { /* ... */ return response()->json([]); }
    public function userStats(Request $request, $id): JsonResponse { /* ... */ return response()->json([]); }
    public function startGame(Request $request, $id): JsonResponse { /* ... */ return response()->json([]); }
}
