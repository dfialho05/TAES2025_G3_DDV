<?php

namespace App\Policies;

use App\Models\BoardTheme;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BoardThemePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BoardTheme $board_theme): bool
    {
        if ($board_theme->is_global) {
            return true;
        }
        if ($board_theme->visibility === 'PU') {
            return true;
        }
        if ($user && $board_theme->user_id === $user->id) {
            return true;
        }
        if ($user && $user->role === 'A') {
            return true;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, BoardTheme $board_theme): bool
    {
        if ($user->role === 'A') {
            return true;
        }
        return $board_theme->user_id === $user->id;
    }

    public function delete(User $user, BoardTheme $board_theme): bool
    {
        if ($user->role === 'A') {
            return true;
        }
        return $board_theme->user_id === $user->id;
    }

    public function restore(User $user, BoardTheme $board_theme): bool
    {
        if ($user->role === 'A') {
            return true;
        }
        return $board_theme->user_id === $user->id;
    }

    public function forceDelete(User $user, BoardTheme $board_theme): bool
    {
        if ($user->role === 'A') {
            return true;
        }
        return $board_theme->user_id === $user->id;
    }
}
