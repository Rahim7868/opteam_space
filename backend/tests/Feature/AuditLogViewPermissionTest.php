<?php

namespace Tests\Feature;

use App\Models\Permission;
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
}