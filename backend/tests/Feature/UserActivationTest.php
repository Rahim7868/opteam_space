<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_with_deactivation_permission_can_reactivate_account(): void
    {
        $permission = Permission::create(['libelle' => 'desactiver_acteurs']);
        $role = Role::create(['libelle' => 'Admin']);
        $role->permissions()->attach($permission);

        $admin = User::create([
            'nom' => 'Administrateur',
            'email' => 'admin@example.com',
            'password' => 'admin-password',
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        $user = User::create([
            'nom' => 'Agent désactivé',
            'email' => 'agent@example.com',
            'password' => 'agent-password',
            'is_active' => false,
            'failed_login_attempts' => 3,
            'motif_desactivation' => 'Compte désactivé automatiquement après 3 tentatives de connexion échouées.',
            'desactive_le' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/users/{$user->id}/toggle-status")
            ->assertOk()
            ->assertJsonPath('is_active', true);

        $user->refresh();

        $this->assertTrue($user->is_active);
        $this->assertSame(0, $user->failed_login_attempts);
        $this->assertNull($user->motif_desactivation);
        $this->assertNull($user->desactive_par);
        $this->assertNull($user->desactive_le);
    }
}
