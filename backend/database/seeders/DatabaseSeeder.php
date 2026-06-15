<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $central = BureauChange::create([
            'numero_ordre' => 'BC001',
            'designation' => 'OPTEAM Central',
            'numero_agrement' => 'AGR-001',
            'representant_legal' => 'Central',
            'contact' => '+33123456789',
            'addresse' => 'Paris',
            'status' => 'active',
        ]);

        $nord = BureauChange::create([
            'numero_ordre' => 'BC002',
            'designation' => 'OPTEAM Nord',
            'numero_agrement' => 'AGR-002',
            'representant_legal' => 'Nord',
            'contact' => '+33987654321',
            'addresse' => 'Lille',
            'status' => 'active',
        ]);

        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $agent1 = User::factory()->create([
            'name' => 'Agent 1',
            'email' => 'a1@test.com',
            'password' => 'password',
            'role' => 'agent',
            'bureau_change_id' => $central->id,
        ]);

        $agent2 = User::factory()->create([
            'name' => 'Agent 2',
            'email' => 'a2@test.com',
            'password' => 'password',
            'role' => 'agent',
            'bureau_change_id' => $nord->id,
        ]);

        Fixing::create([
            'user_id' => $agent1->id,
            'bureau_change_id' => $central->id,
            'devise' => 'EUR',
            'cours' => 10.84,
            'status' => 'pending',
            'date_fixing' => now(),
        ]);

        Fixing::create([
            'user_id' => $agent2->id,
            'bureau_change_id' => $nord->id,
            'devise' => 'USD',
            'cours' => 9.97,
            'status' => 'approved',
            'validated_by' => $admin->id,
            'validated_at' => now(),
            'date_fixing' => now(),
        ]);

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'seed',
            'entity_type' => 'system',
            'description' => 'Initial data',
        ]);
    }
}