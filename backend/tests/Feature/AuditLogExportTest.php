<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditLogExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_pdf_export_requires_the_permission_for_its_audit_category(): void
    {
        $user = $this->userWithPermissions(
            'exporter_audit_actions_utilisateurs_pdf',
            'exporter_audit_locaux_pdf'
        );
        Sanctum::actingAs($user);

        $this->get('/api/export/audit-logs/pdf?category=user-actions&date_fin=' . now()->toDateString())
            ->assertOk();

        $this->getJson('/api/export/audit-logs/pdf?category=exchange')
            ->assertForbidden();

        $this->get('/api/export/audit-logs/pdf?category=locations&date_debut=invalid')
            ->assertUnprocessable();
    }

    public function test_excel_export_requires_its_own_category_permission(): void
    {
        $user = $this->userWithPermissions('exporter_audit_fixings_bureaux_excel');
        Sanctum::actingAs($user);

        $this->get('/api/export/audit-logs/excel?category=exchange')
            ->assertOk();

        $this->getJson('/api/export/audit-logs/excel?category=access-control')
            ->assertForbidden();
    }

    private function userWithPermissions(string ...$permissions): User
    {
        $user = User::create([
            'nom' => 'Export operator',
            'email' => uniqid('audit-export-', true) . '@opteam.test',
            'password' => 'password',
        ]);

        foreach ($permissions as $permissionName) {
            $permission = Permission::firstOrCreate(['libelle' => $permissionName]);
            $user->permissionsDirectes()->attach($permission->id);
        }

        return $user;
    }
}