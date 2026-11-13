<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FailedLoginDeactivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_is_deactivated_after_three_consecutive_failed_logins(): void
    {
        $user = User::create([
            'nom' => 'Agent Test',
            'email' => 'agent@example.com',
            'password' => 'correct-password',
            'is_active' => true,
        ]);
        $user->createToken('existing-session');

        foreach (range(1, 2) as $attempt) {
            $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'incorrect-password',
            ])->assertUnprocessable()
                ->assertJsonPath('errors.email.0', 'Les identifiants sont invalides.');
        }

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'incorrect-password',
        ])->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Trop de tentatives de connexion échouées. Veuillez contacter l’administrateur.'
            )
            ->assertJsonPath(
                'errors.email.0',
                'Trop de tentatives de connexion échouées. Veuillez contacter l’administrateur.'
            );

        $user->refresh();

        $this->assertFalse($user->is_active);
        $this->assertSame(3, $user->failed_login_attempts);
        $this->assertSame(
            'Compte désactivé automatiquement après 3 tentatives de connexion échouées.',
            $user->motif_desactivation
        );
        $this->assertNotNull($user->desactive_le);
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => null,
            'action' => 'user_deactivated',
            'entity_type' => 'User',
            'entity_id' => $user->id,
        ]);
    }

    public function test_successful_login_resets_failed_attempts(): void
    {
        $user = User::create([
            'nom' => 'Agent Test',
            'email' => 'agent@example.com',
            'password' => 'correct-password',
            'is_active' => true,
            'failed_login_attempts' => 2,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ])->assertOk();

        $this->assertSame(0, $user->fresh()->failed_login_attempts);
    }

    public function test_failed_login_attempts_for_another_account_do_not_block_admin_login(): void
    {
        $agent = User::create([
            'nom' => 'Agent Test',
            'email' => 'agent-rate-limit@example.com',
            'password' => 'correct-password',
            'is_active' => true,
        ]);
        $admin = User::create([
            'nom' => 'Admin Test',
            'email' => 'admin-rate-limit@example.com',
            'password' => 'admin-correct-password',
            'is_active' => true,
        ]);

        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/auth/login', [
                'email' => $agent->email,
                'password' => 'incorrect-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', [
            'email' => $admin->email,
            'password' => 'admin-correct-password',
        ])->assertOk();
    }
}
