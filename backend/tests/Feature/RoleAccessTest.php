<?php

namespace Tests\Feature;

use App\Models\BureauChange;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_cannot_create_another_agent(): void
    {
        $bureau = BureauChange::create([
            'numero_ordre' => 'BC001',
            'designation' => 'Central',
            'numero_agrement' => 'AGR-TEST',
            'representant_legal' => 'John Doe',
            'contact' => '0102030405',
            'addresse' => 'Paris',
        ]);

        $agent = User::factory()->create([
            'role' => 'agent',
            'bureau_change_id' => $bureau->numero_ordre,
        ]);

        Sanctum::actingAs($agent);

        $this->postJson('/api/agents', [
            'name' => 'Blocked Agent',
            'email' => 'blocked@opteam.test',
            'password' => 'password',
            'bureau_change_id' => $bureau->numero_ordre,
        ])->assertForbidden();
    }

    public function test_admin_can_create_agent(): void
    {
        $bureau = BureauChange::create([
            'numero_ordre' => 'BC001',
            'designation' => 'Central',
            'numero_agrement' => 'AGR-TEST',
            'representant_legal' => 'John Doe',
            'contact' => '0102030405',
            'addresse' => 'Paris',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->postJson('/api/agents', [
            'name' => 'New Agent',
            'email' => 'new.agent@opteam.test',
            'password' => 'password',
            'bureau_change_id' => $bureau->numero_ordre,
        ])->assertCreated();
    }
}
