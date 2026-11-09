<?php

namespace Tests\Feature;

use App\Models\BureauChange;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BureauChangeBulkActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_bulk_archive_requires_permission_and_does_not_partially_archive(): void
    {
        $user = $this->userWithPermissions('archiver_bureau_change');
        $first = $this->createBureau($user);
        $pending = $this->createBureau($user, [
            'statut_modification' => 'en_attente_validation_modification',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/bureau-changes/archiver-en-masse', [
            'ids' => [$first->id, $pending->id],
        ])->assertUnprocessable();

        $this->assertNotSoftDeleted('bureau_changes', ['id' => $first->id]);
        $this->assertNotSoftDeleted('bureau_changes', ['id' => $pending->id]);

        $pending->update(['statut_modification' => null]);

        $this->postJson('/api/bureau-changes/archiver-en-masse', [
            'ids' => [$first->id, $pending->id],
        ])->assertOk()->assertJsonPath('processed', 2);

        $this->assertSoftDeleted('bureau_changes', ['id' => $first->id]);
        $this->assertSoftDeleted('bureau_changes', ['id' => $pending->id]);
    }

    public function test_bulk_restore_and_force_delete_require_their_own_permissions(): void
    {
        $user = $this->userWithPermissions('restaurer_bureau_change', 'supprimer_definitivement_bureau_change');
        $toRestore = $this->createBureau($user);
        $toDelete = $this->createBureau($user);
        $toRestore->delete();
        $toDelete->delete();
        Sanctum::actingAs($user);

        $this->postJson('/api/bureau-changes/restaurer-en-masse', [
            'ids' => [$toRestore->id, $toRestore->id],
        ])->assertUnprocessable();

        $this->postJson('/api/bureau-changes/restaurer-en-masse', [
            'ids' => [$toRestore->id],
        ])->assertOk()->assertJsonPath('processed', 1);
        $this->assertNotSoftDeleted('bureau_changes', ['id' => $toRestore->id]);

        $this->postJson('/api/bureau-changes/supprimer-definitivement-en-masse', [
            'ids' => [$toDelete->id, $toDelete->id],
        ])->assertUnprocessable();

        $this->postJson('/api/bureau-changes/supprimer-definitivement-en-masse', [
            'ids' => [$toDelete->id],
        ])->assertOk()->assertJsonPath('processed', 1);
        $this->assertDatabaseMissing('bureau_changes', ['id' => $toDelete->id]);
    }

    public function test_archive_permissions_cannot_be_used_for_other_bulk_actions(): void
    {
        $restoreUser = $this->userWithPermissions('restaurer_bureau_change');
        $active = $this->createBureau($restoreUser);
        $archived = $this->createBureau($restoreUser);
        $archived->delete();
        Sanctum::actingAs($restoreUser);

        $this->postJson('/api/bureau-changes/archiver-en-masse', [
            'ids' => [$active->id],
        ])->assertForbidden();
        $this->postJson('/api/bureau-changes/supprimer-definitivement-en-masse', [
            'ids' => [$archived->id],
        ])->assertForbidden();
        $this->postJson('/api/bureau-changes/restaurer-en-masse', [
            'ids' => [$archived->id],
        ])->assertOk();

        $deleteUser = $this->userWithPermissions('supprimer_definitivement_bureau_change');
        $archivedForDelete = $this->createBureau($deleteUser);
        $archivedForDelete->delete();
        Sanctum::actingAs($deleteUser);

        $this->postJson('/api/bureau-changes/restaurer-en-masse', [
            'ids' => [$archivedForDelete->id],
        ])->assertForbidden();
        $this->postJson('/api/bureau-changes/supprimer-definitivement-en-masse', [
            'ids' => [$archivedForDelete->id],
        ])->assertOk();
    }

    public function test_bulk_approval_requires_permission_and_does_not_partially_approve(): void
    {
        $user = $this->userWithPermissions('valider_bureau_change');
        $pending = $this->createBureau($user);
        $alreadyValidated = $this->createBureau($user, ['statut' => 'valide']);
        Sanctum::actingAs($user);

        $this->postJson('/api/bureau-changes/valider-en-masse', [
            'ids' => [$pending->id, $alreadyValidated->id],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('bureau_changes', ['id' => $pending->id, 'statut' => 'en_attente']);

        $this->postJson('/api/bureau-changes/valider-en-masse', [
            'ids' => [$pending->id],
        ])->assertOk()->assertJsonPath('processed', 1);

        $this->assertDatabaseHas('bureau_changes', [
            'id' => $pending->id,
            'statut' => 'valide',
            'validated_by' => $user->id,
        ]);
    }

    public function test_bulk_approval_is_forbidden_without_validation_permission(): void
    {
        $user = $this->userWithPermissions();
        $pending = $this->createBureau($user);
        Sanctum::actingAs($user);

        $this->postJson('/api/bureau-changes/valider-en-masse', [
            'ids' => [$pending->id],
        ])->assertForbidden();

        $this->assertDatabaseHas('bureau_changes', ['id' => $pending->id, 'statut' => 'en_attente']);
    }

    public function test_bulk_archive_restore_and_delete_are_forbidden_without_permissions(): void
    {
        $user = $this->userWithPermissions();
        $archived = $this->createBureau($user);
        $archived->delete();
        Sanctum::actingAs($user);

        $this->postJson('/api/bureau-changes/archiver-en-masse', [
            'ids' => [$archived->id],
        ])->assertForbidden();

        $this->postJson('/api/bureau-changes/restaurer-en-masse', [
            'ids' => [$archived->id],
        ])->assertForbidden();

        $this->postJson('/api/bureau-changes/supprimer-definitivement-en-masse', [
            'ids' => [$archived->id],
        ])->assertForbidden();

        $this->assertSoftDeleted('bureau_changes', ['id' => $archived->id]);
    }

    private function userWithPermissions(string ...$permissions): User
    {
        $user = User::create([
            'nom' => 'Bulk operator',
            'email' => uniqid('bulk-', true) . '@opteam.test',
            'password' => 'password',
        ]);

        foreach ($permissions as $permissionName) {
            $permission = Permission::firstOrCreate(['libelle' => $permissionName]);
            $user->permissionsDirectes()->attach($permission->id);
        }

        return $user;
    }

    private function createBureau(User $user, array $attributes = []): BureauChange
    {
        $suffix = uniqid();

        return BureauChange::create(array_merge([
            'numero_ordre' => 'BC-' . $suffix,
            'designation' => 'Bureau ' . $suffix,
            'numero_agrement' => 'AGR-' . $suffix,
            'representant_legal' => 'Agent Test',
            'created_by' => $user->id,
            'statut' => 'en_attente',
        ], $attributes));
    }
}