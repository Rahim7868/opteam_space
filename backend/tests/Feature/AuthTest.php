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
}
