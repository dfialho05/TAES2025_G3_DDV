<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\User\AdminService;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    protected AdminService $adminService;
    protected UserService $userService;
    protected UserRepository $userRepository;

    public function __construct(
        AdminService $adminService,
        UserService $userService,
        UserRepository $userRepository,
    ) {
        $this->adminService = $adminService;
        $this->userService = $userService;
        $this->userRepository = $userRepository;
    }

    /**
     * List users with optional filters (type, blocked, search) and pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function listUsers(Request $request): JsonResponse
    {
        $perPage = (int) $request->query("per_page", 25);
        $filters = [
            "type" => $request->query("type"),
            "blocked" => $request->query("blocked"),
            "q" => $request->query("q"),
            "include_deleted" => $request->boolean("include_deleted"),
        ];

        $users = $this->userRepository->getUsers($filters, $perPage);

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
     *
     * @param int $id
     * @return JsonResponse
     */
    public function showUser(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id, true);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        return response()->json(new UserResource($user));
    }

    /**
     * Create a new admin user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function createAdmin(Request $request): JsonResponse
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

        try {
            $user = $this->userService->createAdmin($validated);

            return response()->json(
                [
                    "message" => "Admin user created successfully",
                    "user" => new UserResource($user),
                ],
                201,
            );
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => "Failed to create admin user",
                    "error" => config("app.debug") ? $e->getMessage() : null,
                ],
                500,
            );
        }
    }

    /**
     * Block a user account.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function blockUser(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id, true);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        try {
            $user = $this->userService->blockUser($user, $request->user());

            return response()->json([
                "message" => "User blocked successfully",
                "user" => new UserResource($user),
            ]);
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => $e->getMessage(),
                ],
                403,
            );
        }
    }

    /**
     * Unblock a user account.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function unblockUser(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id, true);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        $user = $this->userService->unblockUser($user);

        return response()->json([
            "message" => "User unblocked successfully",
            "user" => new UserResource($user),
        ]);
    }

    /**
     * Delete a user account.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroyUser(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id, true);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        try {
            $hardDeleted = $this->userService->destroyUser(
                $user,
                $request->user(),
            );

            $message = $hardDeleted
                ? "User permanently deleted (no prior activity)"
                : "User soft deleted due to existing activity";

            return response()->json(["message" => $message], 200);
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => $e->getMessage(),
                ],
                403,
            );
        }
    }

    /**
     * Get data for charts (Revenue and Activity)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getChartData(Request $request): JsonResponse
    {
        try {
            $days = (int) $request->query("days", 365);
            $chartData = $this->adminService->getChartData($days);

            return response()->json($chartData);
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => "Failed to fetch chart data",
                    "error" => config("app.debug") ? $e->getMessage() : null,
                ],
                500,
            );
        }
    }

    /**
     * Return transaction history for a specific user (paginated).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function userTransactions(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id, true);

        if (!$user) {
            return response()->json(["message" => "User not found"], 404);
        }

        $perPage = (int) $request->query("per_page", 25);
        $paginator = $this->adminService->getUserTransactions($id, $perPage);

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
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function allTransactions(Request $request): JsonResponse
    {
        $perPage = (int) $request->query("per_page", 25);
        $filters = [
            "user_id" => $request->query("user_id"),
            "type_id" => $request->query("type_id"),
            "date_from" => $request->query("date_from"),
            "date_to" => $request->query("date_to"),
        ];

        $paginator = $this->adminService->getAllTransactions(
            $filters,
            $perPage,
        );

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
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->adminService->getPlatformStats();
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(
                [
                    "message" => "Failed to fetch platform statistics",
                    "error" => config("app.debug") ? $e->getMessage() : null,
                ],
                500,
            );
        }
    }
}
