<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_login_and_fetch_profile(): void
    {
        User::factory()->create([
            'email' => 'admin@opteam.test',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@opteam.test',
            'password' => 'password',
        ]);

        $login->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']]);

        $this->withToken($login->json('token'))
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@opteam.test');
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'inactive@opteam.test',
            'password' => 'password',
            'status' => 'inactive',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'inactive@opteam.test',
            'password' => 'password',
        ])->assertUnprocessable();
    }

    public function test_successful_login_is_audited_with_email_status_and_ip(): void
    {
        $user = User::create([
            'nom' => 'Audit login user',
            'email' => 'login-success@opteam.test',
            'password' => 'password',
            'is_active' => true,
        ]);

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
            ->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ])
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'login',
            'login_email' => $user->email,
            'login_status' => 'success',
            'ip_address' => '203.0.113.10',
        ]);
    }

    public function test_failed_login_attempts_are_audited_for_known_and_unknown_emails(): void
    {
        $user = User::create([
            'nom' => 'Audit login user',
            'email' => 'login-failure@opteam.test',
            'password' => 'password',
            'is_active' => true,
        ]);

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.11'])
            ->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'incorrect',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'login',
            'login_email' => $user->email,
            'login_status' => 'failure',
            'ip_address' => '203.0.113.11',
        ]);

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.12'])
            ->postJson('/api/auth/login', [
                'email' => 'unknown@opteam.test',
                'password' => 'incorrect',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => null,
            'action' => 'login',
            'login_email' => 'unknown@opteam.test',
            'login_status' => 'failure',
            'ip_address' => '203.0.113.12',
        ]);
    }
}
