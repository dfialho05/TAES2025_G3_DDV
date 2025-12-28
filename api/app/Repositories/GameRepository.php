<?php

namespace App\Repositories;

use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class GameRepository
{
    /**
     * Get games for a specific user with optional filters
     *
     * @param int $userId
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUserGames(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Game::query()
            ->with(['player1', 'player2', 'winner', 'deck'])
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            });

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('began_at', 'desc')->paginate($perPage);
    }

    /**
     * Get recent games for a user
     *
     * @param int $userId
     * @param int $limit
     * @return Collection
     */
    public function getRecentGames(int $userId, int $limit = 10): Collection
    {
        return Game::query()
            ->with(['player1', 'player2', 'winner', 'deck'])
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->orderBy('began_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get games by match ID
     *
     * @param int $matchId
     * @return Collection
     */
    public function getGamesByMatch(int $matchId): Collection
    {
        return Game::query()
            ->with(['player1', 'player2', 'winner', 'deck'])
            ->where('match_id', $matchId)
            ->orderBy('began_at', 'asc')
            ->get();
    }

    /**
     * Get user game statistics
     *
     * @param int $userId
     * @return array
     */
    public function getUserStats(int $userId): array
    {
        $stats = DB::table('games')
            ->selectRaw('
                COUNT(*) as total_games,
                SUM(CASE WHEN winner_user_id = ? THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN is_draw = 1 THEN 1 ELSE 0 END) as draws,
                SUM(CASE WHEN winner_user_id IS NOT NULL AND winner_user_id != ? THEN 1 ELSE 0 END) as losses,
                SUM(CASE
                    WHEN winner_user_id = ?
                    AND ((player1_user_id = ? AND player1_points >= 91 AND player1_points <= 119)
                         OR (player2_user_id = ? AND player2_points >= 91 AND player2_points <= 119))
                    THEN 1 ELSE 0
                END) as capotes,
                SUM(CASE
                    WHEN winner_user_id = ?
                    AND ((player1_user_id = ? AND player1_points >= 120)
                         OR (player2_user_id = ? AND player2_points >= 120))
                    THEN 1 ELSE 0
                END) as bandeiras
            ', [$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId])
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->first();

        $totalGames = $stats->total_games ?? 0;
        $wins = $stats->wins ?? 0;
        $winRate = $totalGames > 0 ? round(($wins / $totalGames) * 100, 1) : 0;

        return [
            'total_games' => $totalGames,
            'wins' => $wins,
            'losses' => $stats->losses ?? 0,
            'draws' => $stats->draws ?? 0,
            'win_rate' => $winRate,
            'capotes' => $stats->capotes ?? 0,
            'bandeiras' => $stats->bandeiras ?? 0,
        ];
    }

    /**
     * Get games with detailed filtering
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getGamesWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Game::query()->with(['player1', 'player2', 'winner', 'deck']);

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('began_at', 'desc')->paginate($perPage);
    }

    /**
     * Count games for a user
     *
     * @param int $userId
     * @param array $filters
     * @return int
     */
    public function countUserGames(int $userId, array $filters = []): int
    {
        $query = Game::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            });

        $query = $this->applyFilters($query, $filters);

        return $query->count();
    }

    /**
     * Get user's win streak
     *
     * @param int $userId
     * @return int
     */
    public function getCurrentWinStreak(int $userId): int
    {
        $games = Game::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->orderBy('began_at', 'desc')
            ->get();

        $streak = 0;
        foreach ($games as $game) {
            if ($game->winner_user_id === $userId) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Get games for leaderboard calculations
     *
     * @param string $type Type of calculation (wins, capotes, bandeiras)
     * @param int $limit
     * @return Collection
     */
    public function getLeaderboardGames(string $type = 'wins', int $limit = 10): Collection
    {
        $query = DB::table('games')
            ->join('users', function ($join) {
                $join->on('games.winner_user_id', '=', 'users.id')
                    ->whereNull('users.deleted_at');
            })
            ->where('games.status', 'Ended')
            ->whereNotNull('games.winner_user_id')
            ->where('games.type', 'multiplayer'); // Only multiplayer games

        switch ($type) {
            case 'capotes':
                $query->where(function ($q) {
                    $q->where(function ($subQ) {
                        $subQ->whereColumn('games.player1_user_id', 'games.winner_user_id')
                            ->whereBetween('games.player1_points', [91, 119]);
                    })->orWhere(function ($subQ) {
                        $subQ->whereColumn('games.player2_user_id', 'games.winner_user_id')
                            ->whereBetween('games.player2_points', [91, 119]);
                    });
                });
                break;

            case 'bandeiras':
                $query->where(function ($q) {
                    $q->where(function ($subQ) {
                        $subQ->whereColumn('games.player1_user_id', 'games.winner_user_id')
                            ->where('games.player1_points', '>=', 120);
                    })->orWhere(function ($subQ) {
                        $subQ->whereColumn('games.player2_user_id', 'games.winner_user_id')
                            ->where('games.player2_points', '>=', 120);
                    });
                });
                break;
        }

        return $query
            ->select('games.winner_user_id', 'users.nickname', DB::raw('COUNT(*) as total'))
            ->groupBy('games.winner_user_id', 'users.nickname')
            ->orderByDesc('total')
            ->orderBy('games.began_at', 'asc')
            ->limit($limit)
            ->get();
    }

    /**
     * Apply filters to query
     *
     * @param Builder $query
     * @param array $filters
     * @return Builder
     */
    protected function applyFilters(Builder $query, array $filters): Builder
    {
        // Filter by status
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by type (single-player, multiplayer)
        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Filter by variant (game type: "Bisca de 3", "Bisca de 9")
        if (isset($filters['variant'])) {
            $query->where('type', $filters['variant']);
        }

        // Filter by match ID
        if (isset($filters['match_id'])) {
            if ($filters['match_id'] === 'standalone') {
                $query->whereNull('match_id');
            } else {
                $query->where('match_id', $filters['match_id']);
            }
        }

        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->where('began_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('began_at', '<=', $filters['date_to']);
        }

        // Filter by result (won, lost, draw)
        if (isset($filters['result']) && isset($filters['user_id'])) {
            $userId = $filters['user_id'];
            switch ($filters['result']) {
                case 'won':
                    $query->where('winner_user_id', $userId);
                    break;
                case 'lost':
                    $query->where(function ($q) use ($userId) {
                        $q->where(function ($subQ) use ($userId) {
                            $subQ->where('player1_user_id', $userId)
                                ->orWhere('player2_user_id', $userId);
                        })->whereNotNull('winner_user_id')
                            ->where('winner_user_id', '!=', $userId)
                            ->where('is_draw', false);
                    });
                    break;
                case 'draw':
                    $query->where('is_draw', true);
                    break;
            }
        }

        return $query;
    }

    /**
     * Find game by ID
     *
     * @param int $gameId
     * @return Game|null
     */
    public function findById(int $gameId): ?Game
    {
        return Game::with(['player1', 'player2', 'winner', 'deck', 'match'])->find($gameId);
    }

    /**
     * Create a new game
     *
     * @param array $data
     * @return Game
     */
    public function create(array $data): Game
    {
        return Game::create($data);
    }

    /**
     * Update game
     *
     * @param Game $game
     * @param array $data
     * @return Game
     */
    public function update(Game $game, array $data): Game
    {
        $game->update($data);
        return $game->fresh();
    }
}
