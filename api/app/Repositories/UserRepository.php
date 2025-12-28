<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserRepository
{
    /**
     * Get users with optional filters and pagination
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUsers(array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        $query = User::query()->select([
            'id',
            'name',
            'email',
            'type',
            'blocked',
            'nickname',
            'photo_avatar_filename',
            'coins_balance',
            'created_at',
            'deleted_at',
        ]);

        // Include soft deleted users if requested
        if ($filters['include_deleted'] ?? false) {
            $query->withTrashed();
        }

        $query = $this->applyFilters($query, $filters);

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Find user by ID
     *
     * @param int $userId
     * @param bool $includeTrashed
     * @return User|null
     */
    public function findById(int $userId, bool $includeTrashed = false): ?User
    {
        $query = User::query();

        if ($includeTrashed) {
            $query->withTrashed();
        }

        return $query->find($userId);
    }

    /**
     * Find user by email
     *
     * @param string $email
     * @param bool $includeTrashed
     * @return User|null
     */
    public function findByEmail(string $email, bool $includeTrashed = false): ?User
    {
        $query = User::query();

        if ($includeTrashed) {
            $query->withTrashed();
        }

        return $query->where('email', $email)->first();
    }

    /**
     * Find user by nickname
     *
     * @param string $nickname
     * @param bool $includeTrashed
     * @return User|null
     */
    public function findByNickname(string $nickname, bool $includeTrashed = false): ?User
    {
        $query = User::query();

        if ($includeTrashed) {
            $query->withTrashed();
        }

        return $query->where('nickname', $nickname)->first();
    }

    /**
     * Get all players (type = 'P')
     *
     * @param bool $activeOnly
     * @return Collection
     */
    public function getPlayers(bool $activeOnly = true): Collection
    {
        $query = User::query()->where('type', 'P');

        if ($activeOnly) {
            $query->where('blocked', false);
        }

        return $query->orderBy('nickname')->get();
    }

    /**
     * Get all administrators (type = 'A')
     *
     * @return Collection
     */
    public function getAdministrators(): Collection
    {
        return User::query()
            ->where('type', 'A')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get blocked users
     *
     * @return Collection
     */
    public function getBlockedUsers(): Collection
    {
        return User::query()
            ->where('blocked', true)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get recently registered users
     *
     * @param int $days
     * @param int $limit
     * @return Collection
     */
    public function getRecentUsers(int $days = 7, int $limit = 10): Collection
    {
        return User::query()
            ->where('type', 'P')
            ->where('created_at', '>=', now()->subDays($days))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get top users by coins balance
     *
     * @param int $limit
     * @return Collection
     */
    public function getTopUsersByCoins(int $limit = 10): Collection
    {
        return User::query()
            ->where('type', 'P')
            ->where('blocked', false)
            ->orderByDesc('coins_balance')
            ->limit($limit)
            ->get();
    }

    /**
     * Count users by type
     *
     * @return array
     */
    public function countByType(): array
    {
        $counts = User::query()
            ->select('type', DB::raw('COUNT(*) as total'))
            ->groupBy('type')
            ->get()
            ->pluck('total', 'type')
            ->toArray();

        return [
            'players' => $counts['P'] ?? 0,
            'administrators' => $counts['A'] ?? 0,
        ];
    }

    /**
     * Count blocked users
     *
     * @return int
     */
    public function countBlocked(): int
    {
        return User::query()->where('blocked', true)->count();
    }

    /**
     * Count soft deleted users
     *
     * @return int
     */
    public function countSoftDeleted(): int
    {
        return User::onlyTrashed()->count();
    }

    /**
     * Get user statistics summary
     *
     * @return array
     */
    public function getStatisticsSummary(): array
    {
        $total = User::count();
        $active = User::where('blocked', false)->count();
        $blocked = $this->countBlocked();
        $softDeleted = $this->countSoftDeleted();
        $typeCounts = $this->countByType();

        return [
            'total_users' => $total,
            'active_users' => $active,
            'blocked_users' => $blocked,
            'soft_deleted_users' => $softDeleted,
            'players' => $typeCounts['players'],
            'administrators' => $typeCounts['administrators'],
        ];
    }

    /**
     * Search users by query string
     *
     * @param string $searchQuery
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function searchUsers(string $searchQuery, int $perPage = 25): LengthAwarePaginator
    {
        return User::query()
            ->where(function ($q) use ($searchQuery) {
                $q->where('name', 'like', "%{$searchQuery}%")
                    ->orWhere('email', 'like', "%{$searchQuery}%")
                    ->orWhere('nickname', 'like', "%{$searchQuery}%");
            })
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Get users registered in a date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return Collection
     */
    public function getUsersByDateRange(string $startDate, string $endDate): Collection
    {
        return User::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get users with low balance
     *
     * @param int $threshold
     * @return Collection
     */
    public function getUsersWithLowBalance(int $threshold = 10): Collection
    {
        return User::query()
            ->where('type', 'P')
            ->where('coins_balance', '<', $threshold)
            ->where('blocked', false)
            ->orderBy('coins_balance', 'asc')
            ->get();
    }

    /**
     * Create a new user
     *
     * @param array $data
     * @return User
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Update user
     *
     * @param User $user
     * @param array $data
     * @return User
     */
    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Soft delete user
     *
     * @param User $user
     * @return bool
     */
    public function softDelete(User $user): bool
    {
        return $user->delete();
    }

    /**
     * Force delete user
     *
     * @param User $user
     * @return bool
     */
    public function forceDelete(User $user): bool
    {
        return $user->forceDelete();
    }

    /**
     * Restore soft deleted user
     *
     * @param int $userId
     * @return bool
     */
    public function restore(int $userId): bool
    {
        $user = User::withTrashed()->find($userId);

        if (!$user || !$user->trashed()) {
            return false;
        }

        return $user->restore();
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
        // Filter by type
        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Filter by blocked status
        if (isset($filters['blocked'])) {
            $blocked = filter_var($filters['blocked'], FILTER_VALIDATE_BOOLEAN);
            $query->where('blocked', $blocked);
        }

        // Search query (name, email, nickname)
        if (isset($filters['q']) && !empty($filters['q'])) {
            $searchQuery = $filters['q'];
            $query->where(function ($q) use ($searchQuery) {
                $q->where('name', 'like', "%{$searchQuery}%")
                    ->orWhere('email', 'like', "%{$searchQuery}%")
                    ->orWhere('nickname', 'like', "%{$searchQuery}%");
            });
        }

        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Filter by minimum coins balance
        if (isset($filters['min_coins'])) {
            $query->where('coins_balance', '>=', $filters['min_coins']);
        }

        // Filter by maximum coins balance
        if (isset($filters['max_coins'])) {
            $query->where('coins_balance', '<=', $filters['max_coins']);
        }

        return $query;
    }

    /**
     * Increment user coins balance
     *
     * @param int $userId
     * @param int $amount
     * @return int New balance
     */
    public function incrementCoins(int $userId, int $amount): int
    {
        User::where('id', $userId)->increment('coins_balance', $amount);
        return User::find($userId)->coins_balance;
    }

    /**
     * Decrement user coins balance
     *
     * @param int $userId
     * @param int $amount
     * @return int New balance
     */
    public function decrementCoins(int $userId, int $amount): int
    {
        User::where('id', $userId)->decrement('coins_balance', $amount);
        return User::find($userId)->coins_balance;
    }

    /**
     * Check if email exists (excluding specific user)
     *
     * @param string $email
     * @param int|null $excludeUserId
     * @return bool
     */
    public function emailExists(string $email, ?int $excludeUserId = null): bool
    {
        $query = User::where('email', $email);

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        return $query->exists();
    }

    /**
     * Check if nickname exists (excluding specific user)
     *
     * @param string $nickname
     * @param int|null $excludeUserId
     * @return bool
     */
    public function nicknameExists(string $nickname, ?int $excludeUserId = null): bool
    {
        $query = User::where('nickname', $nickname);

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        return $query->exists();
    }
}
