<?php

namespace App\Policies;

use App\Models\Fixing;
use App\Models\User;

class FixingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->status === 'active';
    }

    public function view(User $user, Fixing $fixing): bool
    {
        return $user->isAdmin() || $fixing->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->status === 'active';
    }

    public function update(User $user, Fixing $fixing): bool
    {
        return $user->isAdmin();
    }

    public function decide(User $user, Fixing $fixing): bool
    {
        return $user->isAdmin() && $fixing->status === 'pending';
    }

    public function requestModification(User $user, Fixing $fixing): bool
    {
        return $user->isAgent() && $fixing->user_id === $user->id && $fixing->status === 'pending';
    }
}
