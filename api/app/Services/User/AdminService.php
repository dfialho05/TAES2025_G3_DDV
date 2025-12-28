<?php

namespace App\Services\User;

use App\Models\User;
use App\Repositories\UserRepository;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AdminService
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Get platform statistics for admin dashboard
     *
     * @return array
     */
    public function getPlatformStats(): array
    {
        $userStats = $this->getUserStats();
        $activityStats = $this->getActivityStats();
        $financialStats = $this->getFinancialStats();
        $recentTransactions = $this->getRecentTransactions(10);
        $topSpenders = $this->getTopSpenders(5);

        return [
            'users' => $userStats,
            'activity' => $activityStats,
            'financial' => $financialStats,
            'recent_transactions' => $recentTransactions,
            'top_spenders' => $topSpenders,
        ];
    }

    /**
     * Get user statistics
     *
     * @return array
     */
    protected function getUserStats(): array
    {
        $totalUsers = DB::table('users')->count();
        $totalAdmins = DB::table('users')->where('type', 'A')->count();
        $totalPlayers = DB::table('users')->where('type', 'P')->count();
        $totalBlocked = DB::table('users')->where('blocked', true)->count();
        $totalDeleted = DB::table('users')->whereNotNull('deleted_at')->count();

        return [
            'total' => $totalUsers,
            'admins' => $totalAdmins,
            'players' => $totalPlayers,
            'blocked' => $totalBlocked,
            'deleted' => $totalDeleted,
        ];
    }

    /**
     * Get activity statistics
     *
     * @return array
     */
    protected function getActivityStats(): array
    {
        $totalMatches = DB::table('matches')->count();
        $totalGames = DB::table('games')->count();
        $ongoingMatches = DB::table('matches')->where('status', 'Playing')->count();
        $ongoingGames = DB::table('games')->where('status', 'Playing')->count();

        return [
            'matches' => $totalMatches,
            'games' => $totalGames,
            'ongoing_matches' => $ongoingMatches,
            'ongoing_games' => $ongoingGames,
        ];
    }

    /**
     * Get financial statistics
     *
     * @return array
     */
    protected function getFinancialStats(): array
    {
        $totalTransactions = DB::table('coin_transactions')->count();
        $totalCoinsTransacted = (int) DB::table('coin_transactions')->sum('coins');
        $totalPurchases = DB::table('coin_purchases')->count();
        $totalPurchasesEuros = (float) DB::table('coin_purchases')->sum('euros');

        return [
            'transactions_count' => $totalTransactions,
            'coins_transacted' => $totalCoinsTransacted,
            'purchases_count' => $totalPurchases,
            'purchases_euros' => $totalPurchasesEuros,
        ];
    }

    /**
     * Get recent transactions
     *
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    protected function getRecentTransactions(int $limit = 10)
    {
        return DB::table('coin_transactions as t')
            ->join('users as u', 't.user_id', '=', 'u.id')
            ->select('t.*', 'u.nickname', 'u.email')
            ->orderByDesc('t.transaction_datetime')
            ->limit($limit)
            ->get();
    }

    /**
     * Get top spenders
     *
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    protected function getTopSpenders(int $limit = 5)
    {
        return DB::table('coin_transactions')
            ->select('user_id', DB::raw('SUM(ABS(coins)) as total_coins'))
            ->groupBy('user_id')
            ->orderByDesc('total_coins')
            ->limit($limit)
            ->get()
            ->map(function ($row) {
                $user = User::withTrashed()->find($row->user_id);
                return [
                    'user_id' => $row->user_id,
                    'nickname' => $user ? $user->nickname : null,
                    'email' => $user ? $user->email : null,
                    'total_coins' => (int) $row->total_coins,
                ];
            });
    }

    /**
     * Get chart data for revenue and activity
     *
     * @param int $days Number of days to include
     * @return array
     */
    public function getChartData(int $days = 365): array
    {
        try {
            // Validate and cap days
            if ($days <= 0) {
                $days = 365;
            }
            $maxDays = 365 * 5;
            if ($days > $maxDays) {
                $days = $maxDays;
            }

            $endDate = now()->startOfDay()->format('Y-m-d');
            $startDate = now()->subDays($days - 1)->startOfDay()->format('Y-m-d');

            $revenueHistory = $this->getRevenueHistory($startDate, $endDate);
            $activityHistory = $this->getActivityHistory($startDate, $endDate);

            Log::info('AdminService:getChartData - generated chart data', [
                'days_requested' => $days,
                'startDate' => $startDate,
                'endDate' => $endDate,
                'revenue_rows' => count($revenueHistory),
                'activity_rows' => count($activityHistory),
            ]);

            return [
                'revenue' => $revenueHistory,
                'activity' => $activityHistory,
            ];
        } catch (\Exception $e) {
            Log::error('AdminService:getChartData - error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Get revenue history by date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    protected function getRevenueHistory(string $startDate, string $endDate): array
    {
        $dateColumn = $this->getPurchaseDateColumn();

        $revenueRows = DB::table('coin_purchases')
            ->select(
                DB::raw("DATE({$dateColumn}) as date"),
                DB::raw('SUM(euros) as total')
            )
            ->whereBetween($dateColumn, [$startDate, $endDate])
            ->groupBy(DB::raw("DATE({$dateColumn})"))
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn($r) => (float) $r->total)
            ->toArray();

        return $this->fillMissingDates($revenueRows, $startDate, $endDate, 0.0);
    }

    /**
     * Get activity history (games) by date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    protected function getActivityHistory(string $startDate, string $endDate): array
    {
        $dateColumn = $this->getGameDateColumn();

        $activityRows = DB::table('games')
            ->select(
                DB::raw("DATE({$dateColumn}) as date"),
                DB::raw('COUNT(*) as total')
            )
            ->whereBetween($dateColumn, [$startDate, $endDate])
            ->groupBy(DB::raw("DATE({$dateColumn})"))
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn($r) => (int) $r->total)
            ->toArray();

        return $this->fillMissingDates($activityRows, $startDate, $endDate, 0);
    }

    /**
     * Fill missing dates in data array
     *
     * @param array $data
     * @param string $startDate
     * @param string $endDate
     * @param mixed $defaultValue
     * @return array
     */
    protected function fillMissingDates(array $data, string $startDate, string $endDate, $defaultValue): array
    {
        $result = [];
        $period = CarbonPeriod::create($startDate, $endDate);

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $result[] = [
                'date' => $dateStr,
                'total' => $data[$dateStr] ?? $defaultValue,
            ];
        }

        return $result;
    }

    /**
     * Get the date column name for coin_purchases table
     *
     * @return string
     */
    protected function getPurchaseDateColumn(): string
    {
        if (Schema::hasColumn('coin_purchases', 'created_at')) {
            return 'created_at';
        }
        if (Schema::hasColumn('coin_purchases', 'purchase_datetime')) {
            return 'purchase_datetime';
        }
        return 'created_at';
    }

    /**
     * Get the date column name for games table
     *
     * @return string
     */
    protected function getGameDateColumn(): string
    {
        if (Schema::hasColumn('games', 'began_at')) {
            return 'began_at';
        }
        if (Schema::hasColumn('games', 'created_at')) {
            return 'created_at';
        }
        return 'created_at';
    }

    /**
     * Get user transactions with pagination
     *
     * @param int $userId
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getUserTransactions(int $userId, int $perPage = 25)
    {
        return DB::table('coin_transactions')
            ->where('user_id', $userId)
            ->orderByDesc('transaction_datetime')
            ->paginate($perPage);
    }

    /**
     * Get all transactions with optional filters and pagination
     *
     * @param array $filters
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getAllTransactions(array $filters = [], int $perPage = 25)
    {
        $query = DB::table('coin_transactions')
            ->orderByDesc('transaction_datetime');

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['type_id'])) {
            $query->where('coin_transaction_type_id', $filters['type_id']);
        }

        if (isset($filters['date_from'])) {
            $query->where('transaction_datetime', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('transaction_datetime', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get revenue by period
     *
     * @param string $period (day, week, month, year)
     * @return array
     */
    public function getRevenueByPeriod(string $period = 'month'): array
    {
        $dateColumn = $this->getPurchaseDateColumn();
        $groupBy = match($period) {
            'day' => "DATE({$dateColumn})",
            'week' => "YEARWEEK({$dateColumn})",
            'month' => "DATE_FORMAT({$dateColumn}, '%Y-%m')",
            'year' => "YEAR({$dateColumn})",
            default => "DATE_FORMAT({$dateColumn}, '%Y-%m')",
        };

        return DB::table('coin_purchases')
            ->select(
                DB::raw("{$groupBy} as period"),
                DB::raw('SUM(euros) as total_revenue'),
                DB::raw('COUNT(*) as total_purchases')
            )
            ->groupBy(DB::raw($groupBy))
            ->orderBy('period', 'desc')
            ->limit(12)
            ->get()
            ->toArray();
    }

    /**
     * Get purchases by player
     *
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    public function getPurchasesByPlayer(int $limit = 10)
    {
        return DB::table('coin_purchases')
            ->join('users', 'coin_purchases.user_id', '=', 'users.id')
            ->select(
                'users.id',
                'users.nickname',
                'users.email',
                DB::raw('SUM(coin_purchases.euros) as total_spent'),
                DB::raw('COUNT(*) as purchase_count')
            )
            ->groupBy('users.id', 'users.nickname', 'users.email')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get();
    }
}
