<?php

namespace Tests\Feature;

use App\Models\Fixing;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FixingRejectPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejecting_a_fixing_requires_the_reject_permission(): void
    {
        $user = $this->createUser('validator-only', 'valider_fixing');
        $fixing = $this->createFixing($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/fixings/{$fixing->id}/rejeter", [
            'commentaire' => 'Cours incorrect',
        ])->assertForbidden();

        $this->assertSame('en_attente', $fixing->fresh()->statut);
    }

    public function test_user_with_reject_permission_can_reject_a_fixing(): void
    {
        $user = $this->createUser('rejecter', 'rejeter_fixing');
        $fixing = $this->createFixing($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/fixings/{$fixing->id}/rejeter", [
            'commentaire' => 'Cours incorrect',
        ])->assertOk();

        $this->assertSame('rejete', $fixing->fresh()->statut);
    }

    private function createUser(string $prefix, string $permissionName): User
    {
        $user = User::create([
            'nom' => $prefix,
            'email' => uniqid($prefix . '-', true) . '@opteam.test',
            'password' => 'password',
        ]);

        $permission = Permission::firstOrCreate(['libelle' => $permissionName]);
        $user->permissionsDirectes()->attach($permission->id);

        return $user;
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
