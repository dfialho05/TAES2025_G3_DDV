<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Game;
use App\Models\Matches;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LeaderboardController extends Controller
{
    /**
     * Get leaderboard based on specific categories
     */
    public function getLeaderboard(Request $request)
    {
        $limit = $request->get("limit", 10);
        $period = $request->get("period", "all"); // all, month
        $type = $request->get("type", "most_wins"); // most_wins, most_matches, most_games, best_winratio

        // Build date filter for period
        $dateFilter = $this->getDateFilter($period);

        switch ($type) {
            case "most_wins":
                return $this->getMostWins($limit, $dateFilter, $period);
            case "most_matches":
                return $this->getMostMatches($limit, $dateFilter, $period);
            case "most_games":
                return $this->getMostGames($limit, $dateFilter, $period);
            case "best_winratio":
                return $this->getBestWinRatio($limit, $dateFilter, $period);
            default:
                return response()->json(
                    ["error" => "Invalid leaderboard type"],
                    400,
                );
        }
    }

    /**
     * Most Wins Leaderboard
     */
    private function getMostWins($limit, $dateFilter, $period)
    {
        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) as wins",
            ),
            DB::raw("COUNT(DISTINCT games.id) as total_games"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id != users.id AND games.winner_user_id IS NOT NULL THEN games.id END) as losses",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT games.id) > 0 THEN (COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) * 100.0 / COUNT(DISTINCT games.id)) ELSE 0 END as win_rate",
            ),
        ])
            ->leftJoin("games", function ($join) {
                $join
                    ->on("users.id", "=", "games.player1_user_id")
                    ->orOn("users.id", "=", "games.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("games.began_at", ">=", $dateFilter["start"])
                ->where("games.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("wins", ">", 0) // Only show users with at least 1 win
            ->orderByDesc("wins")
            ->orderByDesc("win_rate")
            ->limit($limit)
            ->get();

        return $this->formatResponse($leaderboard, $period, "most_wins");
    }

    /**
     * Most Matches Leaderboard
     */
    private function getMostMatches($limit, $dateFilter, $period)
    {
        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw("COUNT(DISTINCT matches.id) as total_matches"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN matches.winner_user_id = users.id THEN matches.id END) as match_wins",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT matches.id) > 0 THEN (COUNT(DISTINCT CASE WHEN matches.winner_user_id = users.id THEN matches.id END) * 100.0 / COUNT(DISTINCT matches.id)) ELSE 0 END as match_win_rate",
            ),
        ])
            ->leftJoin("matches", function ($join) {
                $join
                    ->on("users.id", "=", "matches.player1_user_id")
                    ->orOn("users.id", "=", "matches.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("matches.began_at", ">=", $dateFilter["start"])
                ->where("matches.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("total_matches", ">", 0) // Only show users with at least 1 match
            ->orderByDesc("total_matches")
            ->orderByDesc("match_win_rate")
            ->limit($limit)
            ->get();

        return $this->formatResponse($leaderboard, $period, "most_matches");
    }

    /**
     * Most Games Leaderboard
     */
    private function getMostGames($limit, $dateFilter, $period)
    {
        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw("COUNT(DISTINCT games.id) as total_games"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) as wins",
            ),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id != users.id AND games.winner_user_id IS NOT NULL THEN games.id END) as losses",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT games.id) > 0 THEN (COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) * 100.0 / COUNT(DISTINCT games.id)) ELSE 0 END as win_rate",
            ),
        ])
            ->leftJoin("games", function ($join) {
                $join
                    ->on("users.id", "=", "games.player1_user_id")
                    ->orOn("users.id", "=", "games.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("games.began_at", ">=", $dateFilter["start"])
                ->where("games.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("total_games", ">", 0) // Only show users with at least 1 game
            ->orderByDesc("total_games")
            ->orderByDesc("win_rate")
            ->limit($limit)
            ->get();

        return $this->formatResponse($leaderboard, $period, "most_games");
    }

    /**
     * Best Win Ratio Leaderboard
     */
    private function getBestWinRatio($limit, $dateFilter, $period)
    {
        $minGames = 5; // Minimum games required to be eligible for win ratio ranking

        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw("COUNT(DISTINCT games.id) as total_games"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) as wins",
            ),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id != users.id AND games.winner_user_id IS NOT NULL THEN games.id END) as losses",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT games.id) > 0 THEN (COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) * 100.0 / COUNT(DISTINCT games.id)) ELSE 0 END as win_rate",
            ),
        ])
            ->leftJoin("games", function ($join) {
                $join
                    ->on("users.id", "=", "games.player1_user_id")
                    ->orOn("users.id", "=", "games.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("games.began_at", ">=", $dateFilter["start"])
                ->where("games.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("total_games", ">=", $minGames) // Minimum games requirement
            ->orderByDesc("win_rate")
            ->orderByDesc("wins")
            ->limit($limit)
            ->get();

        return $this->formatResponse(
            $leaderboard,
            $period,
            "best_winratio",
            $minGames,
        );
    }

    /**
     * Format the response with position ranking
     */
    private function formatResponse(
        $leaderboard,
        $period,
        $type,
        $minGames = null,
    ) {
        $leaderboard->each(function ($user, $index) {
            $user->position = $index + 1;
        });

        return response()->json([
            "success" => true,
            "data" => $leaderboard,
            "period" => $period,
            "type" => $type,
            "min_games_required" => $minGames,
        ]);
    }

    /**
     * Get date filter for periods
     */
    private function getDateFilter($period)
    {
        switch ($period) {
            case "month":
                // From day 1 of current month to end of current month
                $startOfMonth = Carbon::now()->startOfMonth();
                $endOfMonth = Carbon::now()->endOfMonth();
                return [
                    "start" => $startOfMonth,
                    "end" => $endOfMonth,
                ];
            case "all":
            default:
                return null;
        }
    }

    /**
     * Get all leaderboard categories at once
     */
    public function getAllLeaderboards(Request $request)
    {
        $limit = $request->get("limit", 5);
        $period = $request->get("period", "all");
        $dateFilter = $this->getDateFilter($period);

        return response()->json([
            "success" => true,
            "period" => $period,
            "leaderboards" => [
                "most_wins" => [
                    "success" => true,
                    "data" => $this->getMostWinsData($limit, $dateFilter),
                    "period" => $period,
                    "type" => "most_wins",
                ],
                "most_matches" => [
                    "success" => true,
                    "data" => $this->getMostMatchesData($limit, $dateFilter),
                    "period" => $period,
                    "type" => "most_matches",
                ],
                "most_games" => [
                    "success" => true,
                    "data" => $this->getMostGamesData($limit, $dateFilter),
                    "period" => $period,
                    "type" => "most_games",
                ],
                "best_winratio" => [
                    "success" => true,
                    "data" => $this->getBestWinRatioData($limit, $dateFilter),
                    "period" => $period,
                    "type" => "best_winratio",
                ],
            ],
        ]);
    }

    /**
     * Get Most Wins data (without response wrapper)
     */
    private function getMostWinsData($limit, $dateFilter)
    {
        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) as wins",
            ),
            DB::raw("COUNT(DISTINCT games.id) as total_games"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id != users.id AND games.winner_user_id IS NOT NULL THEN games.id END) as losses",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT games.id) > 0 THEN (COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) * 100.0 / COUNT(DISTINCT games.id)) ELSE 0 END as win_rate",
            ),
        ])
            ->leftJoin("games", function ($join) {
                $join
                    ->on("users.id", "=", "games.player1_user_id")
                    ->orOn("users.id", "=", "games.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("games.began_at", ">=", $dateFilter["start"])
                ->where("games.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("wins", ">", 0)
            ->orderByDesc("wins")
            ->orderByDesc("win_rate")
            ->limit($limit)
            ->get();

        $leaderboard->each(function ($user, $index) {
            $user->position = $index + 1;
        });

        return $leaderboard;
    }

    /**
     * Get Most Matches data (without response wrapper)
     */
    private function getMostMatchesData($limit, $dateFilter)
    {
        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw("COUNT(DISTINCT matches.id) as total_matches"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN matches.winner_user_id = users.id THEN matches.id END) as match_wins",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT matches.id) > 0 THEN (COUNT(DISTINCT CASE WHEN matches.winner_user_id = users.id THEN matches.id END) * 100.0 / COUNT(DISTINCT matches.id)) ELSE 0 END as match_win_rate",
            ),
        ])
            ->leftJoin("matches", function ($join) {
                $join
                    ->on("users.id", "=", "matches.player1_user_id")
                    ->orOn("users.id", "=", "matches.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("matches.began_at", ">=", $dateFilter["start"])
                ->where("matches.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("total_matches", ">", 0)
            ->orderByDesc("total_matches")
            ->orderByDesc("match_win_rate")
            ->limit($limit)
            ->get();

        $leaderboard->each(function ($user, $index) {
            $user->position = $index + 1;
        });

        return $leaderboard;
    }

    /**
     * Get Most Games data (without response wrapper)
     */
    private function getMostGamesData($limit, $dateFilter)
    {
        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw("COUNT(DISTINCT games.id) as total_games"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) as wins",
            ),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id != users.id AND games.winner_user_id IS NOT NULL THEN games.id END) as losses",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT games.id) > 0 THEN (COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) * 100.0 / COUNT(DISTINCT games.id)) ELSE 0 END as win_rate",
            ),
        ])
            ->leftJoin("games", function ($join) {
                $join
                    ->on("users.id", "=", "games.player1_user_id")
                    ->orOn("users.id", "=", "games.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("games.began_at", ">=", $dateFilter["start"])
                ->where("games.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("total_games", ">", 0)
            ->orderByDesc("total_games")
            ->orderByDesc("win_rate")
            ->limit($limit)
            ->get();

        $leaderboard->each(function ($user, $index) {
            $user->position = $index + 1;
        });

        return $leaderboard;
    }

    /**
     * Get Best Win Ratio data (without response wrapper)
     */
    private function getBestWinRatioData($limit, $dateFilter)
    {
        $minGames = 5;

        $query = User::select([
            "users.id",
            "users.name",
            "users.nickname",
            "users.photo_avatar_filename",
            "users.coins_balance",
            DB::raw("COUNT(DISTINCT games.id) as total_games"),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) as wins",
            ),
            DB::raw(
                "COUNT(DISTINCT CASE WHEN games.winner_user_id != users.id AND games.winner_user_id IS NOT NULL THEN games.id END) as losses",
            ),
            DB::raw(
                "CASE WHEN COUNT(DISTINCT games.id) > 0 THEN (COUNT(DISTINCT CASE WHEN games.winner_user_id = users.id THEN games.id END) * 100.0 / COUNT(DISTINCT games.id)) ELSE 0 END as win_rate",
            ),
        ])
            ->leftJoin("games", function ($join) {
                $join
                    ->on("users.id", "=", "games.player1_user_id")
                    ->orOn("users.id", "=", "games.player2_user_id");
            })
            ->where("users.type", "!=", "A")
            ->where("users.blocked", false);

        if ($dateFilter) {
            $query
                ->where("games.began_at", ">=", $dateFilter["start"])
                ->where("games.began_at", "<=", $dateFilter["end"]);
        }

        $leaderboard = $query
            ->groupBy(
                "users.id",
                "users.name",
                "users.nickname",
                "users.photo_avatar_filename",
                "users.coins_balance",
            )
            ->having("total_games", ">=", $minGames)
            ->orderByDesc("win_rate")
            ->orderByDesc("wins")
            ->limit($limit)
            ->get();

        $leaderboard->each(function ($user, $index) {
            $user->position = $index + 1;
        });

        return $leaderboard;
    }
}
