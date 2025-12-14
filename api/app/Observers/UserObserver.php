<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Ensure BOT user always has the correct coin balance
        if ($this->isBotUser($user)) {
            $user->coins_balance = 999999999999;
            $user->saveQuietly();
        }
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // Prevent BOT coin balance from being changed
        if ($this->isBotUser($user) && $user->coins_balance != 999999999999) {
            $user->coins_balance = 999999999999;
            $user->saveQuietly();
        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }

    /**
     * Check if the user is the BOT user
     */
    private function isBotUser(User $user): bool
    {
        return $user->id === 9999 && $user->nickname === "BOT";
    }
}
