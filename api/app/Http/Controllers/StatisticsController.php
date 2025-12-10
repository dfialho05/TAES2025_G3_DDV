<?php

namespace App\Http\Controllers;

use App\Models\Matches; // Atenção ao nome do teu Model (Match ou Matches)
use App\Models\User;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function getUserStats($id)
    {
        // 1. Validar se o user existe
        $user = User::findOrFail($id);

        // 2. Contar Total de Partidas (Matches)
        // Onde o utilizador é player1 OU player2
        $totalMatches = Matches::where("player1_user_id", $id)
            ->orWhere("player2_user_id", $id)
            ->count();

        // 3. Contar Vitórias em Partidas
        // Assume-se que a coluna winner_user_id guarda o ID do vencedor
        $totalWins = Matches::where("winner_user_id", $id)->count();

        // 4. Calcular Win Rate
        $winRate = 0;
        if ($totalMatches > 0) {
            $winRate = ($totalWins / $totalMatches) * 100;
        }

        // 5. (Opcional) Total de Jogos Individuais (Games) se quiseres
        // Podes usar a lógica do LeaderboardController aqui se necessário

        return response()->json([
            "total_matches" => $totalMatches,
            "total_wins" => $totalWins,
            "win_rate" => round($winRate, 1), // Arredonda a 1 casa decimal (ex: 55.5)
        ]);
    }
}
