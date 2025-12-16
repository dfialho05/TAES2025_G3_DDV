<?php

namespace App\Http\Controllers;

use App\Models\Matches; // Atenção ao nome do teu Model (Match ou Matches)
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    /**
     * Get user statistics including matches and games
     *
     * @param int $id User ID
     * @return JsonResponse
     */
    public function getUserStats($id): JsonResponse
    {
        // 1. Validar se o user existe
        $user = User::findOrFail($id);

        // 2. Contar Total de Partidas (Matches)
        // Onde o utilizador é player1 OU player2
        $totalMatches = Matches::where("player1_user_id", $id)
            ->orWhere("player2_user_id", $id)
            ->count();

        // 3. Contar Vitórias em Partidas (Match Wins)
        // Assume-se que a coluna winner_user_id guarda o ID do vencedor
        $matchWins = Matches::where("winner_user_id", $id)->count();

        // 4. Contar Total de Jogos Individuais (Games)
        // Onde o utilizador é player1 OU player2
        $totalGames = Game::where("player1_user_id", $id)
            ->orWhere("player2_user_id", $id)
            ->where("status", "Ended")
            ->count();

        // 5. Contar Vitórias em Jogos Individuais (Game Wins)
        $gameWins = Game::where("winner_user_id", $id)
            ->where("status", "Ended")
            ->count();

        // 6. Calcular Win Rates
        $matchWinRate = 0;
        if ($totalMatches > 0) {
            $matchWinRate = ($matchWins / $totalMatches) * 100;
        }

        $gameWinRate = 0;
        if ($totalGames > 0) {
            $gameWinRate = ($gameWins / $totalGames) * 100;
        }

        // 7. Calcular Capotes (vitórias com 91-119 pontos)
        $capotes = Game::where("winner_user_id", $id)
            ->where("status", "Ended")
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

        // 8. Calcular Bandeiras (vitórias com 120+ pontos)
        $bandeiras = Game::where("winner_user_id", $id)
            ->where("status", "Ended")
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

        // Para compatibilidade com o frontend existente, usar game wins como total_wins
        // Isto fará com que as vitórias mostradas sejam consistentes com o que o user vê na lista
        return response()->json([
            "total_matches" => $totalMatches,
            "total_wins" => $gameWins, // Usar game wins em vez de match wins
            "win_rate" => round($gameWinRate, 1), // Usar game win rate

            // Informações adicionais para futura expansão
            "match_wins" => $matchWins,
            "match_win_rate" => round($matchWinRate, 1),
            "total_games" => $totalGames,
            "game_wins" => $gameWins,
            "game_win_rate" => round($gameWinRate, 1),

            // Estatísticas de capotes e bandeiras
            "capotes" => $capotes,
            "bandeiras" => $bandeiras,
        ]);
    }
}
