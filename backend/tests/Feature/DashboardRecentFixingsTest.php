<?php

namespace Tests\Feature;

use App\Models\Fixing;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardRecentFixingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_fixing_details_for_the_current_user(): void
    {
        $user = $this->createUser('dashboard-owner');
        Fixing::create([
            'date_fixing' => '2026-11-10',
            'devise' => 'EUR',
            'cours' => 655,
            'created_by' => $user->id,
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);
        $fixing = $this->createFixing($user);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonCount(2, 'recent_fixings');

        $recentFixing = collect($response->json('recent_fixings'))
            ->firstWhere('id', $fixing->id);

        $this->assertNotNull($recentFixing);
        $this->assertSame($user->id, $recentFixing['createur']['id']);
        $this->assertSame(0.957, $recentFixing['variation']);
        $this->assertTrue($recentFixing['is_editable']);
    }

    public function test_dashboard_shows_all_fixings_to_users_who_can_validate_them(): void
    {
        $viewer = $this->createUser('dashboard-validator');
        $owner = $this->createUser('dashboard-other-owner');
        $fixing = $this->createFixing($owner);

        $permission = Permission::firstOrCreate(['libelle' => 'valider_fixing']);
        $viewer->permissionsDirectes()->attach($permission->id);
        Sanctum::actingAs($viewer);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonCount(1, 'recent_fixings')
            ->assertJsonPath('recent_fixings.0.id', $fixing->id)
            ->assertJsonPath('recent_fixings.0.createur.id', $owner->id);
    }

    public function test_dashboard_shows_all_fixings_to_users_who_can_consult_them(): void
    {
        $viewer = $this->createUser('dashboard-reader');
        $owner = $this->createUser('dashboard-reader-owner');
        $fixing = $this->createFixing($owner);

        $permission = Permission::firstOrCreate(['libelle' => 'consulter_fixing']);
        $viewer->permissionsDirectes()->attach($permission->id);
        Sanctum::actingAs($viewer);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonCount(1, 'recent_fixings')
            ->assertJsonPath('recent_fixings.0.id', $fixing->id)
            ->assertJsonPath('recent_fixings.0.createur.id', $owner->id);
    }

    private function createUser(string $prefix): User
    {
        return User::create([
            'nom' => $prefix,
            'email' => uniqid($prefix . '-', true) . '@opteam.test',
            'password' => 'password',
        ]);
    }

    private function createFixing(User $creator): Fixing
    {
        return Fixing::create([
            'date_fixing' => '2026-11-12',
            'devise' => 'EUR',
            'cours' => 655.957,
            'created_by' => $creator->id,
        ]);
    }
}
