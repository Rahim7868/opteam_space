<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PermissionDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_permission_cannot_be_deleted_when_assigned_directly_to_a_user(): void
    {
        $this->authenticatePermissionManager();
        $permission = Permission::create(['libelle' => 'consulter_fichiers']);
        $user = $this->createUser('direct-assignment');
        $user->permissionsDirectes()->attach($permission);

        $this->deleteJson('/api/permissions/' . $permission->id)
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Impossible de supprimer : cette permission est attribuée directement à un utilisateur ou via le rôle d\'un utilisateur.'
            );

        $this->assertDatabaseHas('permissions', ['id' => $permission->id]);
    }

    public function test_permission_cannot_be_deleted_when_assigned_through_a_users_role(): void
    {
        $this->authenticatePermissionManager();
        $permission = Permission::create(['libelle' => 'modifier_fichiers']);
        $role = Role::create(['libelle' => 'Gestionnaire']);
        $role->permissions()->attach($permission);
        $this->createUser('role-assignment', ['role_id' => $role->id]);

        $this->deleteJson('/api/permissions/' . $permission->id)
            ->assertUnprocessable();

        $this->assertDatabaseHas('permissions', ['id' => $permission->id]);
    }

    public function test_unassigned_permission_can_be_deleted(): void
    {
        $this->authenticatePermissionManager();
        $permission = Permission::create(['libelle' => 'permission_inutilisee']);

        $this->deleteJson('/api/permissions/' . $permission->id)
            ->assertOk()
            ->assertJsonPath('message', 'Permission supprimée.');

        $this->assertDatabaseMissing('permissions', ['id' => $permission->id]);
    }

    public function test_permissions_are_listed_by_functional_group_then_name(): void
    {
        $this->authenticatePermissionManager();
        foreach ([
            'creer_fixing',
            'creer_bureau_change',
            'creer_acteurs',
            'gerer_agences',
            'consulter_audits',
        ] as $label) {
            Permission::firstOrCreate(['libelle' => $label]);
        }

        $response = $this->getJson('/api/permissions')->assertOk();
        $labels = array_column($response->json('data'), 'libelle');

        $fixings = array_search('creer_fixing', $labels, true);
        $bureauChanges = array_search('creer_bureau_change', $labels, true);
        $users = array_search('creer_acteurs', $labels, true);
        $permissions = array_search('gerer_permissions', $labels, true);
        $locations = array_search('gerer_agences', $labels, true);
        $audits = array_search('consulter_audits', $labels, true);

        $this->assertNotFalse($fixings);
        $this->assertNotFalse($bureauChanges);
        $this->assertNotFalse($users);
        $this->assertNotFalse($permissions);
        $this->assertNotFalse($locations);
        $this->assertNotFalse($audits);
        $this->assertTrue(
            $fixings < $bureauChanges
            && $bureauChanges < $users
            && $users < $permissions
            && $permissions < $locations
            && $locations < $audits
        );

        $this->assertSame(
            $labels,
            collect($labels)->sort(function (string $first, string $second): int {
                $firstRank = $this->permissionGroupRank($first);
                $secondRank = $this->permissionGroupRank($second);
                $groupComparison = $firstRank <=> $secondRank;

                return $groupComparison !== 0
                    ? $groupComparison
                    : strcasecmp($first, $second);
            })->values()->all()
        );
    }

    private function authenticatePermissionManager(): void
    {
        $manager = $this->createUser('permission-manager');
        $managementPermission = Permission::create(['libelle' => 'gerer_permissions']);
        $manager->permissionsDirectes()->attach($managementPermission);

        Sanctum::actingAs($manager);
    }

    private function createUser(string $identifier, array $attributes = []): User
    {
        return User::create(array_merge([
            'nom' => 'Test ' . $identifier,
            'email' => $identifier . '@opteam.test',
            'password' => 'password',
        ], $attributes));
    }

    private function permissionGroupRank(string $label): int
    {
        $label = strtolower($label);

        foreach ([
            ['fixing'],
            ['bureau'],
            ['acteur', 'utilisateur', 'user'],
            ['role', 'permission'],
            ['agence', 'direction', 'departement', 'service', 'local'],
            ['audit', 'log'],
        ] as $rank => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($label, $keyword)) {
                    return $rank;
                }
            }
        }

        return 6;
    }
}
