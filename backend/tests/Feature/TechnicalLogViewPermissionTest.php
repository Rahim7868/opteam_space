<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TechnicalLogViewPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_technical_log_list_requires_its_dedicated_permission(): void
    {
        $user = User::create([
            'nom' => 'Technical log viewer',
            'email' => uniqid('technical-log-', true) . '@opteam.test',
            'password' => 'password',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/technical-logs')->assertForbidden();
    }

    public function test_authorized_user_sees_recent_sanitized_log_entries(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'technical-log-');
        $this->assertNotFalse($path);

        try {
            file_put_contents(
                $path,
                "[2026-11-12 08:00:00] local.ERROR: Password: hidden-value\n"
                . "[2026-11-12 08:01:00] local.INFO: Application ready\n"
            );
            config()->set('logging.default', 'single');
            config()->set('logging.channels.single.path', $path);

            $user = User::create([
                'nom' => 'Technical log viewer',
                'email' => uniqid('technical-log-', true) . '@opteam.test',
                'password' => 'password',
            ]);
            $permission = Permission::firstOrCreate(['libelle' => 'consulter_logs_techniques']);
            $user->permissionsDirectes()->attach($permission->id);
            Sanctum::actingAs($user);

            $response = $this->getJson('/api/technical-logs?level=error');
            $response
                ->assertOk()
                ->assertJsonPath('data.0.level', 'error')
                ->assertJsonPath('data.0.message', 'Password: [masqué]');
            $this->assertStringNotContainsString('hidden-value', $response->getContent());
        } finally {
            unlink($path);
        }
    }
}
