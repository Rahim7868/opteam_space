<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditLogDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_bulk_delete_is_limited_to_the_selected_category_and_filters(): void
    {
        $user = $this->userWithPermissions('supprimer_audit_fixings_bureaux');
        $matching = $this->createLog($user, 'fixing_created', 'Fixing', now()->toDateString());
        $outsideDate = $this->createLog($user, 'bureau_created', 'BureauChange', now()->subDay()->toDateString());
        $outsideCategory = $this->createLog($user, 'agence_created', 'Agence', now()->toDateString());
        Sanctum::actingAs($user);

        $this->deleteJson('/api/audit-logs/bulk', [
            'category' => 'exchange',
            'date_debut' => now()->toDateString(),
            'ids' => [$matching->id, $outsideDate->id],
        ])->assertUnprocessable();

        $this->assertDatabaseHas('audit_logs', ['id' => $matching->id]);
        $this->assertDatabaseHas('audit_logs', ['id' => $outsideDate->id]);

        $this->deleteJson('/api/audit-logs/bulk', [
            'category' => 'exchange',
            'date_debut' => now()->toDateString(),
            'ids' => [$matching->id],
        ])->assertOk()->assertJsonPath('deleted', 1);

        $this->assertDatabaseMissing('audit_logs', ['id' => $matching->id]);
        $this->assertDatabaseHas('audit_logs', ['id' => $outsideCategory->id]);
    }

    public function test_delete_permissions_are_separate_for_each_audit_category(): void
    {
        $user = $this->userWithPermissions('supprimer_audit_locaux');
        $locationLog = $this->createLog($user, 'agence_created', 'Agence');
        $exchangeLog = $this->createLog($user, 'fixing_created', 'Fixing');
        Sanctum::actingAs($user);

        $this->deleteJson("/api/audit-logs/{$exchangeLog->id}", [
            'category' => 'exchange',
        ])->assertForbidden();

        $this->deleteJson("/api/audit-logs/{$locationLog->id}", [
            'category' => 'locations',
        ])->assertOk();

        $this->assertDatabaseHas('audit_logs', ['id' => $exchangeLog->id]);
        $this->assertDatabaseMissing('audit_logs', ['id' => $locationLog->id]);
    }

    public function test_bulk_delete_requires_a_permission_for_the_category(): void
    {
        $user = $this->userWithPermissions('supprimer_audit_actions_utilisateurs');
        $log = $this->createLog($user, 'agence_created', 'Agence');
        Sanctum::actingAs($user);

        $this->deleteJson('/api/audit-logs/bulk', [
            'category' => 'locations',
            'ids' => [$log->id],
        ])->assertForbidden();

        $this->assertDatabaseHas('audit_logs', ['id' => $log->id]);
    }

    private function userWithPermissions(string ...$permissions): User
    {
        $user = User::create([
            'nom' => 'Audit operator',
            'email' => uniqid('audit-', true) . '@opteam.test',
            'password' => 'password',
        ]);

        foreach ($permissions as $permissionName) {
            $permission = Permission::firstOrCreate(['libelle' => $permissionName]);
            $user->permissionsDirectes()->attach($permission->id);
        }

        return $user;
    }

    private function createLog(User $user, string $action, string $entityType, ?string $date = null): AuditLog
    {
        $log = AuditLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => 1,
            'description' => $action,
        ]);

        if ($date) {
            $log->created_at = $date . ' 12:00:00';
            $log->save();
        }

        return $log;
    }
}