<?php

namespace App\Policies;

use App\Models\BureauChange;
use App\Models\User;

class BureauChangePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->status === 'active';
    }

    public function view(User $user, BureauChange $bureauChange): bool
    {
        return $user->status === 'active';
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, BureauChange $bureauChange): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, BureauChange $bureauChange): bool
    {
        return $user->isAdmin();
    }
}
