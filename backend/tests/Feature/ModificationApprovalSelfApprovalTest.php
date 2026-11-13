<?php

namespace Tests\Feature;

use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModificationApprovalSelfApprovalTest extends TestCase
{
    use RefreshDatabase;

    private const APPROVAL_PERMISSIONS = [
        'approuver_modification_fixing',
        'approuver_modification_bureau',
        'approuver_modification_user',
    ];

    public function test_non_admin_cannot_approve_own_modifications_even_with_admin_permissions(): void
    {
        $user = $this->userWithRoleAndPermissions('Gestionnaire', [
            ...self::APPROVAL_PERMISSIONS,
            'creer_acteurs',
            'modifier_acteurs',
        ]);
        [$fixing, $bureau] = $this->createPendingModifications($user);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/fixings/{$fixing->id}/approuver-modification")
            ->assertForbidden();

        $this->postJson("/api/bureau-changes/{$bureau->id}/approuver-modification")
            ->assertForbidden();

        $this->postJson("/api/users/{$user->id}/approuver-modification")
            ->assertForbidden();

        $this->assertDatabaseHas('fixings', [
            'id' => $fixing->id,
            'statut_modification' => 'en_attente_validation_modification',
            'cours' => 100,
        ]);
        $this->assertDatabaseHas('bureau_changes', [
            'id' => $bureau->id,
            'statut_modification' => 'en_attente_validation_modification',
            'designation' => 'Bureau original',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'statut_modification' => 'en_attente_validation_modification',
            'nom' => 'Gestionnaire',
        ]);
    }

    public function test_admin_can_approve_own_modifications_for_all_supported_records(): void
    {
        $admin = $this->userWithRoleAndPermissions('Admin', self::APPROVAL_PERMISSIONS);
        [$fixing, $bureau] = $this->createPendingModifications($admin);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/fixings/{$fixing->id}/approuver-modification")
            ->assertOk();

        $this->postJson("/api/bureau-changes/{$bureau->id}/approuver-modification")
            ->assertOk();

        $this->postJson("/api/users/{$admin->id}/approuver-modification")
            ->assertOk();

        $this->assertDatabaseHas('fixings', [
            'id' => $fixing->id,
            'statut_modification' => null,
            'cours' => 120,
            'modification_approuvee_par' => $admin->id,
        ]);
        $this->assertDatabaseHas('bureau_changes', [
            'id' => $bureau->id,
            'statut_modification' => null,
            'designation' => 'Bureau modifié',
            'modification_approuvee_par' => $admin->id,
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'statut_modification' => null,
            'nom' => 'Administrateur modifié',
            'modification_approuvee_par' => $admin->id,
        ]);
    }

    private function userWithRoleAndPermissions(string $roleName, array $permissionNames): User
    {
        $role = Role::create(['libelle' => $roleName]);
        $user = User::create([
            'nom' => $roleName,
            'email' => uniqid('approval-', true) . '@opteam.test',
            'password' => 'password',
            'role_id' => $role->id,
        ]);

        foreach ($permissionNames as $permissionName) {
            $permission = Permission::firstOrCreate(['libelle' => $permissionName]);
            $user->permissionsDirectes()->attach($permission->id);
        }

        return $user;
    }

    private function createPendingModifications(User $author): array
    {
        $fixing = Fixing::create([
            'date_fixing' => '2026-11-13',
            'devise' => 'EUR',
            'cours' => 100,
            'statut' => 'en_attente',
            'created_by' => $author->id,
            'statut_modification' => 'en_attente_validation_modification',
            'modification_proposee' => ['cours' => 120],
            'modification_proposee_par' => $author->id,
        ]);

        $bureau = BureauChange::create([
            'numero_ordre' => uniqid('BC-'),
            'designation' => 'Bureau original',
            'numero_agrement' => uniqid('AGR-'),
            'representant_legal' => 'Représentant',
            'statut' => 'en_attente',
            'created_by' => $author->id,
            'statut_modification' => 'en_attente_validation_modification',
            'modification_proposee' => ['designation' => 'Bureau modifié'],
            'modification_proposee_par' => $author->id,
        ]);

        $author->update([
            'statut_modification' => 'en_attente_validation_modification',
            'modification_proposee' => ['nom' => 'Administrateur modifié'],
            'modification_proposee_par' => $author->id,
        ]);

        return [$fixing, $bureau];
    }
}
