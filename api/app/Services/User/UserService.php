<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserService
{
    /**
     * Register a new user with welcome bonus
     *
     * @param array $data
     * @return User
     * @throws \Exception
     */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // Handle soft-deleted users with same email
            $this->handleSoftDeletedEmail($data['email']);

            // Create new user with welcome bonus
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'nickname' => $data['nickname'] ?? null,
                'photo_avatar_filename' => $data['photo_avatar_filename'] ?? null,
                'coins_balance' => 10, // Welcome bonus
                'type' => 'P', // Player by default
                'blocked' => false,
            ]);

            return $user;
        });
    }

    /**
     * Update user profile
     *
     * @param User $user
     * @param array $data
     * @return User
     */
    public function updateProfile(User $user, array $data): User
    {
        // Handle password hashing if provided
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return $user->fresh();
    }

    /**
     * Delete user account (soft delete for players with activity)
     *
     * @param User $user
     * @param string $password
     * @return void
     * @throws ValidationException
     * @throws \Exception
     */
    public function deleteAccount(User $user, string $password): void
    {
        // Verify password
        if (!Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        // Administrators cannot delete their own accounts
        if ($user->isType('A')) {
            throw new \Exception('Administrators cannot delete their own accounts.');
        }

        // Soft delete (can be expanded to check for activity)
        $user->delete();
    }

    /**
     * Create admin user
     *
     * @param array $data
     * @return User
     */
    public function createAdmin(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'nickname' => $data['nickname'],
            'type' => 'A',
            'blocked' => false,
            'coins_balance' => 0, // Admins don't have coins
        ]);
    }

    /**
     * Block a user
     *
     * @param User $user
     * @param User $admin
     * @return User
     * @throws \Exception
     */
    public function blockUser(User $user, User $admin): User
    {
        // Prevent self-blocking
        if ($admin->id === $user->id) {
            throw new \Exception('You cannot block your own account');
        }

        $user->blocked = true;
        $user->save();

        return $user;
    }

    /**
     * Unblock a user
     *
     * @param User $user
     * @return User
     */
    public function unblockUser(User $user): User
    {
        $user->blocked = false;
        $user->save();

        return $user;
    }

    /**
     * Update user photo/avatar
     *
     * @param User $user
     * @param string $filename
     * @return User
     */
    public function updatePhoto(User $user, string $filename): User
    {
        $user->photo_avatar_filename = basename($filename);
        $user->save();

        return $user;
    }

    /**
     * Check if user has activity in the system
     *
     * @param int $userId
     * @return bool
     */
    public function hasActivity(int $userId): bool
    {
        // Check coin transactions
        if (DB::table('coin_transactions')->where('user_id', $userId)->exists()) {
            return true;
        }

        // Check coin purchases
        if (DB::table('coin_purchases')->where('user_id', $userId)->exists()) {
            return true;
        }

        // Check matches
        $matchesExists = DB::table('matches')
            ->where('player1_user_id', $userId)
            ->orWhere('player2_user_id', $userId)
            ->exists();
        if ($matchesExists) {
            return true;
        }

        // Check games
        $gamesExists = DB::table('games')
            ->where('player1_user_id', $userId)
            ->orWhere('player2_user_id', $userId)
            ->exists();
        if ($gamesExists) {
            return true;
        }

        return false;
    }

    /**
     * Delete user (soft or hard delete based on activity)
     *
     * @param User $user
     * @param User $admin
     * @return bool Returns true if hard deleted, false if soft deleted
     * @throws \Exception
     */
    public function destroyUser(User $user, User $admin): bool
    {
        // Prevent self-deletion
        if ($admin->id === $user->id) {
            throw new \Exception('You cannot remove your own account');
        }

        $hasActivity = $this->hasActivity($user->id);

        if ($hasActivity) {
            // Soft delete
            if (!$user->trashed()) {
                $user->delete();
            }
            return false; // Soft deleted
        } else {
            // Hard delete
            $user->forceDelete();
            return true; // Hard deleted
        }
    }

    /**
     * Handle soft-deleted users with the same email
     * Appends a suffix to avoid unique constraint violations
     *
     * @param string $email
     * @return void
     */
    protected function handleSoftDeletedEmail(string $email): void
    {
        $trashed = User::withTrashed()
            ->where('email', $email)
            ->whereNotNull('deleted_at')
            ->first();

        if ($trashed) {
            $trashed->email = $trashed->email . '?deleted_newAccount:' . $trashed->id;
            $trashed->save();
        }
    }
}
