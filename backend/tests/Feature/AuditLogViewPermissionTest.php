<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditLogViewPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_list_requires_the_view_permission(): void
    {
        $user = User::create([
            'nom' => 'Audit viewer',
            'email' => uniqid('audit-view-', true) . '@opteam.test',
            'password' => 'password',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/audit-logs?category=locations')->assertForbidden();

        $permission = Permission::firstOrCreate(['libelle' => 'consulter_audits']);
        $user->permissionsDirectes()->attach($permission->id);
        Sanctum::actingAs($user->fresh());

        $this->getJson('/api/audit-logs?category=locations')->assertOk();
    }

    public function test_login_audit_entries_expose_email_result_and_ip(): void
    {
        $user = User::create([
            'nom' => 'Audit viewer',
            'email' => uniqid('audit-login-', true) . '@opteam.test',
            'password' => 'password',
        ]);
        $permission = Permission::firstOrCreate(['libelle' => 'consulter_audits']);
        $user->permissionsDirectes()->attach($permission->id);
        AuditLog::create([
            'action' => 'login',
            'entity_type' => 'User',
            'login_email' => 'login@example.test',
            'login_status' => 'failure',
            'ip_address' => '203.0.113.42',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/audit-logs?category=user-actions')
            ->assertOk()
            ->assertJsonPath('data.0.login_email', 'login@example.test')
            ->assertJsonPath('data.0.login_status', 'failure')
            ->assertJsonPath('data.0.ip_address', '203.0.113.42');
    }

    public function test_technical_log_endpoint_and_permission_are_removed(): void
    {
        $this->getJson('/api/technical-logs')->assertNotFound();

        $this->assertDatabaseMissing('permissions', [
            'libelle' => 'consulter_logs_techniques',
        ]);
    }
}