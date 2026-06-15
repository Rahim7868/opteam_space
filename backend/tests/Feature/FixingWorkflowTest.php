<?php

namespace Tests\Feature;

use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FixingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_creates_pending_fixing_for_own_bureau(): void
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

        $this->postJson('/api/fixings', [
            'date_fixing' => '2026-05-29',
            'devise' => 'EUR',
            'cours' => 10.84,
        ])->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.user_id', $agent->id)
            ->assertJsonPath('data.bureau_change_id', $bureau->numero_ordre);
    }

    public function test_admin_can_approve_and_reject_pending_fixings(): void
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

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $toApprove = Fixing::create([
            'user_id' => $agent->id,
            'bureau_change_id' => $bureau->numero_ordre,
            'date_fixing' => '2026-05-29',
            'devise' => 'EUR',
            'cours' => 10.84,
        ]);

        $toReject = Fixing::create([
            'user_id' => $agent->id,
            'bureau_change_id' => $bureau->numero_ordre,
            'date_fixing' => '2026-05-29',
            'devise' => 'USD',
            'cours' => 9.97,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/fixings/{$toApprove->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->postJson("/api/fixings/{$toReject->id}/reject", [
            'rejection_reason' => 'Cours incorrect',
        ])->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Cours incorrect');
    }

    public function test_fixing_variation_is_calculated_from_previous_same_currency_fixing(): void
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

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        Fixing::create([
            'user_id' => $agent->id,
            'bureau_change_id' => $bureau->numero_ordre,
            'date_fixing' => '2026-06-01',
            'devise' => 'USD',
            'cours' => 8650,
        ]);

        $increase = Fixing::create([
            'user_id' => $agent->id,
            'bureau_change_id' => $bureau->numero_ordre,
            'date_fixing' => '2026-06-02',
            'devise' => 'USD',
            'cours' => 8720,
        ]);

        $decrease = Fixing::create([
            'user_id' => $agent->id,
            'bureau_change_id' => $bureau->numero_ordre,
            'date_fixing' => '2026-06-03',
            'devise' => 'USD',
            'cours' => 8600,
        ]);

        Fixing::create([
            'user_id' => $agent->id,
            'bureau_change_id' => $bureau->numero_ordre,
            'date_fixing' => '2026-06-02',
            'devise' => 'EUR',
            'cours' => 9000,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/fixings/{$increase->id}")
            ->assertOk()
            ->assertJsonPath('data.variation', 70);

        $this->getJson("/api/fixings/{$decrease->id}")
            ->assertOk()
            ->assertJsonPath('data.variation', -120);
    }
}