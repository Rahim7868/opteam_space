<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class FixRolesSeeder extends Seeder
{
    public function run(): void
    {
        User::where('email', 'admin@opteam.test')->update(['role' => 'admin', 'status' => 'active']);
        User::where('email', 'amina.agent@opteam.test')->update(['role' => 'agent', 'status' => 'active']);
        User::where('email', 'youssef.agent@opteam.test')->update(['role' => 'agent', 'status' => 'active']);

        $this->command->info('Roles mis a jour:');
        foreach (User::all() as $u) {
            $this->command->info($u->email . ' => ' . $u->role . ' (' . $u->status . ')');
        }
    }
}
