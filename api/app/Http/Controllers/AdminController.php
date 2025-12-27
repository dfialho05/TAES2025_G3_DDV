<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * List users with optional filters (type, blocked, search) and pagination.
     */
    public function listUsers(Request $request): \Illuminate\Http\JsonResponse
    {
        $perPage = (int) $request->query("per_page", 25);

        $query = User::query()->select(
            "id",
            "name",
            "email",
            "type",
            "blocked",
            "nickname",
            "created_at",
        );

        if ($request->boolean("include_deleted")) {
            $query = $query->withTrashed();
        }

        if ($type = $request->query("type")) {
            $query->where("type", $type);
        }

        if ($request->has("blocked")) {
            $blocked = filter_var(
                $request->query("blocked"),
                FILTER_VALIDATE_BOOLEAN,
            );
            $query->where("blocked", $blocked);
        }

        if ($q = $request->query("q")) {
            $query->where(function ($qbuilder) use ($q) {
                $qbuilder
                    ->where("name", "like", "%{$q}%")
                    ->orWhere("email", "like", "%{$q}%")
                    ->orWhere("nickname", "like", "%{$q}%");
            });
        }

        $users = $query->orderByDesc("created_at")->paginate($perPage);

        return response()->json([
            "data" => UserResource::collection($users->items()),
            "meta" => [
                "current_page" => $users->currentPage(),
                "per_page" => $users->perPage(),
                "total" => $users->total(),
                "last_page" => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Get full details for a single user (including trashed).
     */
    public function showUser(int $id): \Illuminate\Http\JsonResponse
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        return response()->json(new UserResource($user));
    }

    /**
     * Create a new admin user.
     */
    public function createAdmin(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => [
                "required",
                "string",
                "email",
                "max:255",
                Rule::unique("users", "email"),
            ],
            "password" => "required|string|min:8",
            "nickname" => [
                "required",
                "string",
                "max:20",
                Rule::unique("users", "nickname"),
            ],
        ]);

        $user = User::create([
            "name" => $validated["name"],
            "email" => $validated["email"],
            "password" => Hash::make($validated["password"]),
            "nickname" => $validated["nickname"],
            "type" => "A",
            "blocked" => false,
            "coins_balance" => 0,
        ]);

        return response()->json(
            [
                "message" => "Admin user created successfully",
                "user" => new UserResource($user),
            ],
            201,
        );
    }

    /**
     * Block a user account.
     */
    public function blockUser(
        Request $request,
        int $id,
    ): \Illuminate\Http\JsonResponse {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        // Admins shouldn't be able to block themselves
        if ($request->user()->id === $user->id) {
            return response()->json(
                ["message" => "You cannot block your own account"],
                403,
            );
        }

        $user->blocked = true;
        $user->save();

        return response()->json([
            "message" => "User blocked",
            "user" => new UserResource($user),
        ]);
    }

    /**
     * Unblock a user account.
     */
    public function unblockUser($id)
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        $user->blocked = false;
        $user->save();

        return response()->json([
            "message" => "User unblocked",
            "user" => new UserResource($user),
        ]);
    }

    /**
     * Delete a user account.
     */
    public function destroyUser(
        Request $request,
        int $id,
    ): \Illuminate\Http\JsonResponse {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        if ($request->user()->id === $user->id) {
            return response()->json(
                ["message" => "You cannot remove your own account"],
                403,
            );
        }

        $hasActivity = $this->userHasActivity($user->id);

        if ($hasActivity) {
            // Soft delete
            if ($user->trashed()) {
                return response()->json(
                    ["message" => "User is already removed (soft deleted)"],
                    200,
                );
            }
            $user->delete();
            return response()->json(
                ["message" => "User soft deleted due to existing activity"],
                200,
            );
        } else {
            // Permanently delete
            $user->forceDelete();
            return response()->json(
                ["message" => "User permanently deleted (no prior activity)"],
                200,
            );
        }
    }

    /**
     * Helper to detect whether a user has historical activity that requires soft-delete.
     */
    protected function userHasActivity(int $userId): bool
    {
        // coin transactions
        if (
            DB::table("coin_transactions")->where("user_id", $userId)->exists()
        ) {
            return true;
        }

        // coin purchases
        if (DB::table("coin_purchases")->where("user_id", $userId)->exists()) {
            return true;
        }

        // matches table
        $matchesExists = DB::table("matches")
            ->where("player1_id", $userId)
            ->orWhere("player2_id", $userId)
            ->orWhere("winner_id", $userId)
            ->exists();
        if ($matchesExists) {
            return true;
        }

        // games table
        $gamesExists = DB::table("games")
            ->where("player1_id", $userId)
            ->orWhere("player2_id", $userId)
            ->orWhere("winner_id", $userId)
            ->exists();
        if ($gamesExists) {
            return true;
        }

        return false;
    }

    /**
     * Get data for charts (Revenue and Activity) - SQLite Safe
     */
    /**
     * Get data for charts (Revenue and Activity) - MySQL Version
     */
    /**
     * Get data for charts (Revenue and Activity) - MySQL/SQLite safe, configurable range
     *
     * Query parameter:
     *   - days (int) : number of days to include (default 365)
     *
     * This method will return a row for every date in the range (start..end),
     * filling missing dates with total = 0 so the frontend can render continuous series.
     */
    public function getChartData()
    {
        try {
            // Determine requested range (default 365 days)
            $days = (int) request()->query("days", 365);
            if ($days <= 0) {
                $days = 365;
            }
            // Cap to a reasonable maximum to avoid heavy queries (e.g., 5 years)
            $maxDays = 365 * 5;
            if ($days > $maxDays) {
                $days = $maxDays;
            }

            // Start / end dates (inclusive). Keep format YYYY-MM-DD for grouping.
            $endDate = now()->startOfDay()->format("Y-m-d");
            $startDate = now()
                ->subDays($days - 1)
                ->startOfDay()
                ->format("Y-m-d");

            // Determine which date column exists in coin_purchases
            $purchaseDateCol = \Illuminate\Support\Facades\Schema::hasColumn(
                "coin_purchases",
                "created_at",
            )
                ? "created_at"
                : (\Illuminate\Support\Facades\Schema::hasColumn(
                    "coin_purchases",
                    "purchase_datetime",
                )
                    ? "purchase_datetime"
                    : "created_at");

            // Revenue aggregated per day within range
            $revenueRows = \Illuminate\Support\Facades\DB::table(
                "coin_purchases",
            )
                ->select(
                    \Illuminate\Support\Facades\DB::raw(
                        "DATE({$purchaseDateCol}) as date",
                    ),
                    \Illuminate\Support\Facades\DB::raw("SUM(euros) as total"),
                )
                ->whereBetween($purchaseDateCol, [$startDate, $endDate])
                ->groupBy(
                    \Illuminate\Support\Facades\DB::raw(
                        "DATE({$purchaseDateCol})",
                    ),
                )
                ->orderBy("date")
                ->get()
                ->map(function ($r) {
                    return [
                        "date" => $r->date,
                        "total" => (float) $r->total,
                    ];
                })
                ->keyBy("date")
                ->toArray();

            // Determine which date column exists in games
            $gameDateCol = \Illuminate\Support\Facades\Schema::hasColumn(
                "games",
                "created_at",
            )
                ? "created_at"
                : (\Illuminate\Support\Facades\Schema::hasColumn(
                    "games",
                    "began_at",
                )
                    ? "began_at"
                    : "created_at");

            // Activity (number of games) aggregated per day within range
            $activityRows = \Illuminate\Support\Facades\DB::table("games")
                ->select(
                    \Illuminate\Support\Facades\DB::raw(
                        "DATE({$gameDateCol}) as date",
                    ),
                    \Illuminate\Support\Facades\DB::raw("COUNT(*) as total"),
                )
                ->whereBetween($gameDateCol, [$startDate, $endDate])
                ->groupBy(
                    \Illuminate\Support\Facades\DB::raw("DATE({$gameDateCol})"),
                )
                ->orderBy("date")
                ->get()
                ->map(function ($r) {
                    return [
                        "date" => $r->date,
                        "total" => (int) $r->total,
                    ];
                })
                ->keyBy("date")
                ->toArray();

            // Build full date series and fill missing dates with zeros
            $revenueHistory = [];
            $activityHistory = [];

            // Use Carbon Period to iterate days
            $period = \Carbon\CarbonPeriod::create($startDate, $endDate);
            foreach ($period as $dt) {
                $d = $dt->format("Y-m-d");

                $rev = isset($revenueRows[$d])
                    ? $revenueRows[$d]["total"]
                    : 0.0;
                $act = isset($activityRows[$d])
                    ? $activityRows[$d]["total"]
                    : 0;

                $revenueHistory[] = [
                    "date" => $d,
                    "total" => $rev,
                ];
                $activityHistory[] = [
                    "date" => $d,
                    "total" => $act,
                ];
            }

            // Log detected columns and result sizes to help debugging
            \Illuminate\Support\Facades\Log::info(
                "AdminController:getChartData - detected columns and result counts",
                [
                    "days_requested" => $days,
                    "startDate" => $startDate,
                    "endDate" => $endDate,
                    "purchaseDateCol" => $purchaseDateCol,
                    "gameDateCol" => $gameDateCol,
                    "revenue_rows_db" => is_array($revenueRows)
                        ? count($revenueRows)
                        : null,
                    "activity_rows_db" => is_array($activityRows)
                        ? count($activityRows)
                        : null,
                    "revenue_rows_final" => count($revenueHistory),
                    "activity_rows_final" => count($activityHistory),
                ],
            );

            return response()->json([
                "revenue" => $revenueHistory,
                "activity" => $activityHistory,
            ]);
        } catch (\Exception $e) {
            // Log full error for diagnostics
            \Illuminate\Support\Facades\Log::error(
                "AdminController:getChartData - unexpected error",
                [
                    "message" => $e->getMessage(),
                    "trace" => $e->getTraceAsString(),
                ],
            );

            return response()->json(
                [
                    "message" => "Failed to fetch chart data",
                    "error" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    /**
     * Return transaction history for a specific user (paginated).
     */
    public function userTransactions(Request $request, $id)
    {
        $perPage = (int) $request->query("per_page", 25);

        $user = User::withTrashed()->find($id);
        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        $query = DB::table("coin_transactions")
            ->where("user_id", $id)
            ->orderByDesc("transaction_datetime");

        $paginator = $query->paginate($perPage);

        return response()->json([
            "data" => $paginator->items(),
            "meta" => [
                "current_page" => $paginator->currentPage(),
                "per_page" => $paginator->perPage(),
                "total" => $paginator->total(),
                "last_page" => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Return platform-wide transactions with optional filters.
     */
    public function allTransactions(Request $request)
    {
        $perPage = (int) $request->query("per_page", 25);

        $query = DB::table("coin_transactions")->orderByDesc(
            "transaction_datetime",
        );

        if ($userId = $request->query("user_id")) {
            $query->where("user_id", $userId);
        }

        if ($typeId = $request->query("type_id")) {
            $query->where("coin_transaction_type_id", $typeId);
        }

        if ($from = $request->query("date_from")) {
            $query->where("transaction_datetime", ">=", $from);
        }

        if ($to = $request->query("date_to")) {
            $query->where("transaction_datetime", "<=", $to);
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            "data" => $paginator->items(),
            "meta" => [
                "current_page" => $paginator->currentPage(),
                "per_page" => $paginator->perPage(),
                "total" => $paginator->total(),
                "last_page" => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Platform statistics for the admin dashboard.
     */
    public function stats()
    {
        $totalUsers = DB::table("users")->count();
        $totalAdmins = DB::table("users")->where("type", "A")->count();
        $totalPlayers = DB::table("users")->where("type", "P")->count();
        $totalBlocked = DB::table("users")->where("blocked", true)->count();
        $totalDeleted = DB::table("users")->whereNotNull("deleted_at")->count();

        $totalMatches = DB::table("matches")->count();
        $totalGames = DB::table("games")->count();

        $totalTransactions = DB::table("coin_transactions")->count();
        $totalCoinsTransacted = (int) DB::table("coin_transactions")->sum(
            "coins",
        );

        $totalPurchases = DB::table("coin_purchases")->count();
        $totalPurchasesEuros = (float) DB::table("coin_purchases")->sum(
            "euros",
        );

        // Recent transactions (last 10) with user info
        $recentTransactions = DB::table("coin_transactions as t")
            ->join("users as u", "t.user_id", "=", "u.id")
            ->select("t.*", "u.nickname", "u.email")
            ->orderByDesc("t.transaction_datetime")
            ->limit(10)
            ->get();

        // Top 5 spenders (by coins spent absolute)
        $topSpenders = DB::table("coin_transactions")
            ->select("user_id", DB::raw("SUM(ABS(coins)) as total_coins"))
            ->groupBy("user_id")
            ->orderByDesc("total_coins")
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $user = User::withTrashed()->find($row->user_id);
                return [
                    "user_id" => $row->user_id,
                    "nickname" => $user ? $user->nickname : null,
                    "total_coins" => (int) $row->total_coins,
                ];
            });

        return response()->json([
            "users" => [
                "total" => $totalUsers,
                "admins" => $totalAdmins,
                "players" => $totalPlayers,
                "blocked" => $totalBlocked,
                "deleted" => $totalDeleted,
            ],
            "activity" => [
                "matches" => $totalMatches,
                "games" => $totalGames,
            ],
            "financial" => [
                "transactions_count" => $totalTransactions,
                "coins_transacted" => $totalCoinsTransacted,
                "purchases_count" => $totalPurchases,
                "purchases_euros" => $totalPurchasesEuros,
            ],
            "recent_transactions" => $recentTransactions,
            "top_spenders" => $topSpenders,
        ]);
    }
}
