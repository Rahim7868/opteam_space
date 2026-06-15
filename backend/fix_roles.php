<?php

use App\Models\User;

// Fix admin role
User::where('email', 'admin@opteam.test')->update(['role' => 'admin']);
User::where('email', 'amina.agent@opteam.test')->update(['role' => 'agent']);
User::where('email', 'youssef.agent@opteam.test')->update(['role' => 'agent']);

// Display results
$users = User::all(['email', 'role', 'status']);
foreach ($users as $user) {
    echo $user->email . ' => role=' . $user->role . ', status=' . $user->status . PHP_EOL;
}

echo PHP_EOL . 'Roles mis a jour avec succes!' . PHP_EOL;
