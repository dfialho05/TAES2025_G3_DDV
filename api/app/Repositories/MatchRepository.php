<?php

namespace App\Repositories;

use App\Models\Matches;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MatchRepository
{
    /**
     * Get matches for a specific user with optional filters
     *
     * @param int $userId
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUserMatches(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Matches::query()
            ->with(['player1', 'player2', 'winner', 'games'])
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            });

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('began_at', 'desc')->paginate($perPage);
    }

    /**
     * Get recent matches for a user
     *
     * @param int $userId
     * @param int $limit
     * @return Collection
     */
    public function getRecentMatches(int $userId, int $limit = 10): Collection
    {
        return Matches::query()
            ->with(['player1', 'player2', 'winner', 'games'])
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
     * Get user match statistics
     *
     * @param int $userId
     * @return array
     */
    public function getUserStats(int $userId): array
    {
        $stats = DB::table('matches')
            ->selectRaw('
                COUNT(*) as total_matches,
                SUM(CASE WHEN winner_user_id = ? THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN winner_user_id IS NOT NULL AND winner_user_id != ? THEN 1 ELSE 0 END) as losses,
                AVG(CASE
                    WHEN player1_user_id = ? THEN player1_marks
                    WHEN player2_user_id = ? THEN player2_marks
                    ELSE 0
                END) as avg_marks,
                MAX(CASE
                    WHEN player1_user_id = ? THEN player1_marks
                    WHEN player2_user_id = ? THEN player2_marks
                    ELSE 0
                END) as max_marks
            ', [$userId, $userId, $userId, $userId, $userId, $userId])
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->first();

        $totalMatches = $stats->total_matches ?? 0;
        $wins = $stats->wins ?? 0;
        $winRate = $totalMatches > 0 ? round(($wins / $totalMatches) * 100, 1) : 0;

        return [
            'total_matches' => $totalMatches,
            'wins' => $wins,
            'losses' => $stats->losses ?? 0,
            'win_rate' => $winRate,
            'avg_marks' => round($stats->avg_marks ?? 0, 1),
            'max_marks' => $stats->max_marks ?? 0,
        ];
    }

    /**
     * Get matches with detailed filtering
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getMatchesWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Matches::query()->with(['player1', 'player2', 'winner', 'games']);

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('began_at', 'desc')->paginate($perPage);
    }

    /**
     * Count matches for a user
     *
     * @param int $userId
     * @param array $filters
     * @return int
     */
    public function countUserMatches(int $userId, array $filters = []): int
    {
        $query = Matches::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            });

        $query = $this->applyFilters($query, $filters);

        return $query->count();
    }

    /**
     * Get matches for leaderboard calculations
     *
     * @param int $limit
     * @return Collection
     */
    public function getLeaderboardMatches(int $limit = 10): Collection
    {
        return DB::table('matches')
            ->join('users', function ($join) {
                $join->on('matches.winner_user_id', '=', 'users.id')
                    ->whereNull('users.deleted_at');
            })
            ->where('matches.status', 'Ended')
            ->whereNotNull('matches.winner_user_id')
            ->where('matches.type', 'multiplayer')
            ->select('matches.winner_user_id', 'users.nickname', DB::raw('COUNT(*) as total'))
            ->groupBy('matches.winner_user_id', 'users.nickname')
            ->orderByDesc('total')
            ->orderBy('matches.began_at', 'asc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get user's current win streak
     *
     * @param int $userId
     * @return int
     */
    public function getCurrentWinStreak(int $userId): int
    {
        $matches = Matches::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->where('status', 'Ended')
            ->orderBy('began_at', 'desc')
            ->get();

        $streak = 0;
        foreach ($matches as $match) {
            if ($match->winner_user_id === $userId) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Find match by ID
     *
     * @param int $matchId
     * @return Matches|null
     */
    public function findById(int $matchId): ?Matches
    {
        return Matches::with(['player1', 'player2', 'winner', 'games'])->find($matchId);
    }

    /**
     * Find match by ID including trashed
     *
     * @param int $matchId
     * @return Matches|null
     */
    public function findByIdWithTrashed(int $matchId): ?Matches
    {
        return Matches::withTrashed()
            ->with(['player1', 'player2', 'winner', 'games'])
            ->find($matchId);
    }

    /**
     * Create a new match
     *
     * @param array $data
     * @return Matches
     */
    public function create(array $data): Matches
    {
        return Matches::create($data);
    }

    /**
     * Update match
     *
     * @param Matches $match
     * @param array $data
     * @return Matches
     */
    public function update(Matches $match, array $data): Matches
    {
        $match->update($data);
        return $match->fresh();
    }

    /**
     * Delete match
     *
     * @param Matches $match
     * @return bool
     */
    public function delete(Matches $match): bool
    {
        return $match->delete();
    }

    /**
     * Get pending matches
     *
     * @return Collection
     */
    public function getPendingMatches(): Collection
    {
        return Matches::query()
            ->where('status', 'Pending')
            ->orderBy('began_at', 'desc')
            ->get();
    }

    /**
     * Get ongoing matches
     *
     * @return Collection
     */
    public function getOngoingMatches(): Collection
    {
        return Matches::query()
            ->where('status', 'Playing')
            ->orderBy('began_at', 'desc')
            ->get();
    }

    /**
     * Get matches by date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return Collection
     */
    public function getMatchesByDateRange(string $startDate, string $endDate): Collection
    {
        return Matches::query()
            ->whereBetween('began_at', [$startDate, $endDate])
            ->orderBy('began_at', 'desc')
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

        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->where('began_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('began_at', '<=', $filters['date_to']);
        }

        // Filter by result (won, lost)
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
                            ->where('winner_user_id', '!=', $userId);
                    });
                    break;
            }
        }

        // Filter by stake
        if (isset($filters['stake_min'])) {
            $query->where('stake', '>=', $filters['stake_min']);
        }

        if (isset($filters['stake_max'])) {
            $query->where('stake', '<=', $filters['stake_max']);
        }

        return $query;
    }

    /**
     * Get matches between two users
     *
     * @param int $userId1
     * @param int $userId2
     * @return Collection
     */
    public function getMatchesBetweenUsers(int $userId1, int $userId2): Collection
    {
        return Matches::query()
            ->where(function ($q) use ($userId1, $userId2) {
                $q->where(function ($subQ) use ($userId1, $userId2) {
                    $subQ->where('player1_user_id', $userId1)
                        ->where('player2_user_id', $userId2);
                })->orWhere(function ($subQ) use ($userId1, $userId2) {
                    $subQ->where('player1_user_id', $userId2)
                        ->where('player2_user_id', $userId1);
                });
            })
            ->orderBy('began_at', 'desc')
            ->get();
    }

    /**
     * Get head to head stats between two users
     *
     * @param int $userId1
     * @param int $userId2
     * @return array
     */
    public function getHeadToHeadStats(int $userId1, int $userId2): array
    {
        $matches = $this->getMatchesBetweenUsers($userId1, $userId2);

        $user1Wins = $matches->where('winner_user_id', $userId1)->count();
        $user2Wins = $matches->where('winner_user_id', $userId2)->count();
        $total = $matches->count();

        return [
            'total_matches' => $total,
            'user1_wins' => $user1Wins,
            'user2_wins' => $user2Wins,
            'user1_win_rate' => $total > 0 ? round(($user1Wins / $total) * 100, 1) : 0,
            'user2_win_rate' => $total > 0 ? round(($user2Wins / $total) * 100, 1) : 0,
        ];
    }
}
