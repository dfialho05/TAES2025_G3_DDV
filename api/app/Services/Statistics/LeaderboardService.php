<?php

namespace App\Services\Statistics;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class LeaderboardService
{
    /**
     * Get leaderboard data by type
     *
     * @param string $type
     * @param array $filters
     * @return array
     */
    public function getLeaderboard(string $type, array $filters = []): array
    {
        $method = 'get' . ucfirst($type) . 'Leaderboard';

        if (!method_exists($this, $method)) {
            throw new \InvalidArgumentException("Invalid leaderboard type: {$type}");
        }

        return $this->$method($filters);
    }

    /**
     * Get wins leaderboard (game wins)
     *
     * @param array $filters
     * @return array
     */
    public function getWinsLeaderboard(array $filters = []): array
    {
        $limit = $filters['limit'] ?? 10;
        $dateFilter = $this->getDateFilter($filters);

        $query = DB::table('games')
            ->join('users', 'games.winner_user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->where('games.status', 'Ended')
            ->whereNotNull('games.winner_user_id')
            ->where('games.type', 'multiplayer');

        if ($dateFilter) {
            $query->where('games.began_at', '>=', $dateFilter);
        }

        $results = $query
            ->select(
                'users.id',
                'users.nickname',
                'users.photo_avatar_filename',
                DB::raw('COUNT(*) as total'),
                DB::raw('MIN(games.began_at) as first_win_at')
            )
            ->groupBy('users.id', 'users.nickname', 'users.photo_avatar_filename')
            ->orderByDesc('total')
            ->orderBy('first_win_at', 'asc')
            ->limit($limit)
            ->get();

        return $this->formatLeaderboard($results, 'Game Wins');
    }

    /**
     * Get matches leaderboard (match wins)
     *
     * @param array $filters
     * @return array
     */
    public function getMatchesLeaderboard(array $filters = []): array
    {
        $limit = $filters['limit'] ?? 10;
        $dateFilter = $this->getDateFilter($filters);

        $query = DB::table('matches')
            ->join('users', 'matches.winner_user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->where('matches.status', 'Ended')
            ->whereNotNull('matches.winner_user_id')
            ->where('matches.type', 'multiplayer');

        if ($dateFilter) {
            $query->where('matches.began_at', '>=', $dateFilter);
        }

        $results = $query
            ->select(
                'users.id',
                'users.nickname',
                'users.photo_avatar_filename',
                DB::raw('COUNT(*) as total'),
                DB::raw('MIN(matches.began_at) as first_win_at')
            )
            ->groupBy('users.id', 'users.nickname', 'users.photo_avatar_filename')
            ->orderByDesc('total')
            ->orderBy('first_win_at', 'asc')
            ->limit($limit)
            ->get();

        return $this->formatLeaderboard($results, 'Match Wins');
    }

    /**
     * Get games leaderboard (total games played)
     *
     * @param array $filters
     * @return array
     */
    public function getGamesLeaderboard(array $filters = []): array
    {
        $limit = $filters['limit'] ?? 10;
        $dateFilter = $this->getDateFilter($filters);

        $query = DB::table('games')
            ->join('users', function ($join) {
                $join->on('games.player1_user_id', '=', 'users.id')
                    ->orOn('games.player2_user_id', '=', 'users.id');
            })
            ->whereNull('users.deleted_at')
            ->where('games.status', 'Ended')
            ->where('games.type', 'multiplayer');

        if ($dateFilter) {
            $query->where('games.began_at', '>=', $dateFilter);
        }

        $results = $query
            ->select(
                'users.id',
                'users.nickname',
                'users.photo_avatar_filename',
                DB::raw('COUNT(*) as total'),
                DB::raw('MIN(games.began_at) as first_game_at')
            )
            ->groupBy('users.id', 'users.nickname', 'users.photo_avatar_filename')
            ->orderByDesc('total')
            ->orderBy('first_game_at', 'asc')
            ->limit($limit)
            ->get();

        return $this->formatLeaderboard($results, 'Total Games');
    }

    /**
     * Get capotes leaderboard
     *
     * @param array $filters
     * @return array
     */
    public function getCapotesLeaderboard(array $filters = []): array
    {
        $limit = $filters['limit'] ?? 10;
        $dateFilter = $this->getDateFilter($filters);

        $query = DB::table('games')
            ->join('users', 'games.winner_user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->where('games.status', 'Ended')
            ->whereNotNull('games.winner_user_id')
            ->where('games.type', 'multiplayer')
            ->where(function ($q) {
                $q->where(function ($subQ) {
                    $subQ->whereColumn('games.player1_user_id', 'games.winner_user_id')
                        ->whereBetween('games.player1_points', [91, 119]);
                })->orWhere(function ($subQ) {
                    $subQ->whereColumn('games.player2_user_id', 'games.winner_user_id')
                        ->whereBetween('games.player2_points', [91, 119]);
                });
            });

        if ($dateFilter) {
            $query->where('games.began_at', '>=', $dateFilter);
        }

        $results = $query
            ->select(
                'users.id',
                'users.nickname',
                'users.photo_avatar_filename',
                DB::raw('COUNT(*) as total'),
                DB::raw('MIN(games.began_at) as first_achievement_at')
            )
            ->groupBy('users.id', 'users.nickname', 'users.photo_avatar_filename')
            ->orderByDesc('total')
            ->orderBy('first_achievement_at', 'asc')
            ->limit($limit)
            ->get();

        return $this->formatLeaderboard($results, 'Capotes');
    }

    /**
     * Get bandeiras leaderboard
     *
     * @param array $filters
     * @return array
     */
    public function getBandeirasLeaderboard(array $filters = []): array
    {
        $limit = $filters['limit'] ?? 10;
        $dateFilter = $this->getDateFilter($filters);

        $query = DB::table('games')
            ->join('users', 'games.winner_user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->where('games.status', 'Ended')
            ->whereNotNull('games.winner_user_id')
            ->where('games.type', 'multiplayer')
            ->where(function ($q) {
                $q->where(function ($subQ) {
                    $subQ->whereColumn('games.player1_user_id', 'games.winner_user_id')
                        ->where('games.player1_points', '>=', 120);
                })->orWhere(function ($subQ) {
                    $subQ->whereColumn('games.player2_user_id', 'games.winner_user_id')
                        ->where('games.player2_points', '>=', 120);
                });
            });

        if ($dateFilter) {
            $query->where('games.began_at', '>=', $dateFilter);
        }

        $results = $query
            ->select(
                'users.id',
                'users.nickname',
                'users.photo_avatar_filename',
                DB::raw('COUNT(*) as total'),
                DB::raw('MIN(games.began_at) as first_achievement_at')
            )
            ->groupBy('users.id', 'users.nickname', 'users.photo_avatar_filename')
            ->orderByDesc('total')
            ->orderBy('first_achievement_at', 'asc')
            ->limit($limit)
            ->get();

        return $this->formatLeaderboard($results, 'Bandeiras');
    }

    /**
     * Get all leaderboards at once
     *
     * @param array $filters
     * @return array
     */
    public function getAllLeaderboards(array $filters = []): array
    {
        return [
            'wins' => $this->getWinsLeaderboard($filters),
            'matches' => $this->getMatchesLeaderboard($filters),
            'games' => $this->getGamesLeaderboard($filters),
            'capotes' => $this->getCapotesLeaderboard($filters),
            'bandeiras' => $this->getBandeirasLeaderboard($filters),
        ];
    }

    /**
     * Get personal leaderboard for a user
     *
     * @param int $userId
     * @param array $filters
     * @return array
     */
    public function getPersonalLeaderboard(int $userId, array $filters = []): array
    {
        $dateFilter = $this->getDateFilter($filters);

        // Game stats
        $gameStats = $this->getUserGameStats($userId, $dateFilter);

        // Match stats
        $matchStats = $this->getUserMatchStats($userId, $dateFilter);

        // Achievements
        $achievements = $this->getUserAchievements($userId, $dateFilter);

        return [
            'games' => $gameStats,
            'matches' => $matchStats,
            'achievements' => $achievements,
        ];
    }

    /**
     * Get user game statistics
     *
     * @param int $userId
     * @param string|null $dateFilter
     * @return array
     */
    protected function getUserGameStats(int $userId, ?string $dateFilter = null): array
    {
        $query = DB::table('games')
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->where('type', 'multiplayer');

        if ($dateFilter) {
            $query->where('began_at', '>=', $dateFilter);
        }

        $stats = $query->selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN winner_user_id = ? THEN 1 ELSE 0 END) as wins
        ', [$userId])->first();

        $total = $stats->total ?? 0;
        $wins = $stats->wins ?? 0;
        $winRate = $total > 0 ? round(($wins / $total) * 100, 1) : 0;

        return [
            'total' => $total,
            'wins' => $wins,
            'losses' => $total - $wins,
            'win_rate' => $winRate,
        ];
    }

    /**
     * Get user match statistics
     *
     * @param int $userId
     * @param string|null $dateFilter
     * @return array
     */
    protected function getUserMatchStats(int $userId, ?string $dateFilter = null): array
    {
        $query = DB::table('matches')
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->where('type', 'multiplayer');

        if ($dateFilter) {
            $query->where('began_at', '>=', $dateFilter);
        }

        $stats = $query->selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN winner_user_id = ? THEN 1 ELSE 0 END) as wins
        ', [$userId])->first();

        $total = $stats->total ?? 0;
        $wins = $stats->wins ?? 0;
        $winRate = $total > 0 ? round(($wins / $total) * 100, 1) : 0;

        return [
            'total' => $total,
            'wins' => $wins,
            'losses' => $total - $wins,
            'win_rate' => $winRate,
        ];
    }

    /**
     * Get user achievements (capotes and bandeiras)
     *
     * @param int $userId
     * @param string|null $dateFilter
     * @return array
     */
    protected function getUserAchievements(int $userId, ?string $dateFilter = null): array
    {
        $query = DB::table('games')
            ->where('winner_user_id', $userId)
            ->where('status', 'Ended')
            ->where('type', 'multiplayer');

        if ($dateFilter) {
            $query->where('began_at', '>=', $dateFilter);
        }

        $stats = $query->selectRaw('
            SUM(CASE
                WHEN (player1_user_id = ? AND player1_points >= 91 AND player1_points <= 119)
                  OR (player2_user_id = ? AND player2_points >= 91 AND player2_points <= 119)
                THEN 1 ELSE 0
            END) as capotes,
            SUM(CASE
                WHEN (player1_user_id = ? AND player1_points >= 120)
                  OR (player2_user_id = ? AND player2_points >= 120)
                THEN 1 ELSE 0
            END) as bandeiras
        ', [$userId, $userId, $userId, $userId])->first();

        return [
            'capotes' => $stats->capotes ?? 0,
            'bandeiras' => $stats->bandeiras ?? 0,
        ];
    }

    /**
     * Format leaderboard results
     *
     * @param Collection $results
     * @param string $category
     * @return array
     */
    protected function formatLeaderboard(Collection $results, string $category): array
    {
        $leaderboard = $results->map(function ($item, $index) {
            return [
                'rank' => $index + 1,
                'user_id' => $item->id,
                'nickname' => $item->nickname,
                'photo_avatar_filename' => $item->photo_avatar_filename,
                'total' => (int) $item->total,
            ];
        })->toArray();

        return [
            'category' => $category,
            'leaderboard' => $leaderboard,
            'total_entries' => count($leaderboard),
        ];
    }

    /**
     * Get date filter based on period
     *
     * @param array $filters
     * @return string|null
     */
    protected function getDateFilter(array $filters): ?string
    {
        if (!isset($filters['period'])) {
            return null;
        }

        $period = $filters['period'];
        $now = now();

        return match ($period) {
            'week' => $now->subWeek()->toDateTimeString(),
            'month' => $now->subMonth()->toDateTimeString(),
            'year' => $now->subYear()->toDateTimeString(),
            'all-time' => null,
            default => null,
        };
    }
}
