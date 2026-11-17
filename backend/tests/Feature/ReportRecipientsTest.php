<?php

namespace Tests\Feature;

use App\Models\Fixing;
use App\Models\Permission;
use App\Models\ReportRecipient;
use App\Models\User;
use App\Notifications\FixingReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportRecipientsTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_recipients_require_the_management_permission(): void
    {
        $user = $this->createUser();
        Sanctum::actingAs($user);

        $this->getJson('/api/report-recipients')->assertForbidden();

        $this->grantReportManagement($user);
        Sanctum::actingAs($user->fresh());

        $this->getJson('/api/report-recipients')->assertOk()->assertJsonPath('data', []);
    }

    public function test_manager_can_create_update_pause_and_delete_a_recipient(): void
    {
        $manager = $this->createUser();
        $this->grantReportManagement($manager);
        $manager = $manager->fresh();
        Sanctum::actingAs($manager);

        $this->postJson('/api/report-recipients', [
            'name' => 'Aminata',
            'email' => 'aminata@example.test',
            'type' => 'weekly',
            'is_active' => true,
            'include_attachments' => false,
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Aminata')
            ->assertJsonPath('data.type', 'weekly');

        $recipient = ReportRecipient::where('email', 'aminata@example.test')->firstOrFail();

        $this->patchJson("/api/report-recipients/{$recipient->id}/status", [
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->patchJson("/api/report-recipients/{$recipient->id}/attachments", [
            'include_attachments' => true,
        ])->assertOk()
            ->assertJsonPath('data.include_attachments', true);

        $this->putJson("/api/report-recipients/{$recipient->id}", [
            'name' => 'Aminata Diallo',
            'email' => 'aminata@example.test',
            'type' => 'monthly',
            'is_active' => false,
            'include_attachments' => true,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Aminata Diallo')
            ->assertJsonPath('data.type', 'monthly');

        $this->deleteJson("/api/report-recipients/{$recipient->id}")->assertOk();
        $this->assertDatabaseMissing('report_recipients', ['id' => $recipient->id]);
    }

    public function test_recipient_email_must_be_unique_and_frequency_valid(): void
    {
        $manager = $this->createUser();
        $this->grantReportManagement($manager);
        $manager = $manager->fresh();
        Sanctum::actingAs($manager);

        ReportRecipient::create([
            'email' => 'duplicate@example.test',
            'type' => 'daily',
            'is_active' => true,
            'include_attachments' => false,
        ]);

        $this->postJson('/api/report-recipients', [
            'email' => 'duplicate@example.test',
            'type' => 'yearly',
            'is_active' => true,
            'include_attachments' => false,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'type']);
    }

    public function test_daily_and_weekly_reports_go_only_to_active_recipients_of_due_types(): void
    {
        Carbon::setTestNow('2026-11-02 08:00:00');
        Notification::fake();

        $creator = $this->createUser();
        Fixing::create([
            'date_fixing' => '2026-11-01',
            'devise' => 'USD',
            'cours' => 1.234567,
            'statut' => 'valide',
            'created_by' => $creator->id,
        ]);

        $daily = $this->createRecipient('daily', 'daily@example.test');
        $paused = $this->createRecipient('daily', 'paused@example.test', false);
        $weekly = $this->createRecipient('weekly', 'weekly@example.test');
        $dailyWeekly = $this->createRecipient('daily_weekly', 'daily-weekly@example.test');
        $monthly = $this->createRecipient('monthly', 'monthly@example.test');

        Artisan::call('report:send-weekly-fixings');

        Notification::assertSentTo($daily, FixingReport::class);
        Notification::assertSentTo($weekly, FixingReport::class);
        Notification::assertSentToTimes($dailyWeekly, FixingReport::class, 2);
        Notification::assertNotSentTo($paused, FixingReport::class);
        Notification::assertNotSentTo($monthly, FixingReport::class);
    }

    public function test_monthly_report_covers_the_previous_calendar_month(): void
    {
        Carbon::setTestNow('2026-12-01 08:00:00');
        Notification::fake();

        $creator = $this->createUser();
        Fixing::create([
            'date_fixing' => '2026-11-15',
            'devise' => 'EUR',
            'cours' => 1.1,
            'statut' => 'en_attente',
            'created_by' => $creator->id,
        ]);
        $recipient = $this->createRecipient('monthly', 'monthly@example.test', true, true);

        Artisan::call('report:send-weekly-fixings');

        Notification::assertSentTo($recipient, FixingReport::class);
        $notification = Notification::sent($recipient, FixingReport::class)->first();
        $mail = $notification->toMail($recipient);
        $this->assertCount(2, $mail->rawAttachments);
        $this->assertSame('Rapport mensuel des fixings', $mail->subject);
        $this->assertStringContainsString('Rapport Mensuel des fixings', (string) $mail->render());
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function createUser(): User
    {
        return User::create([
            'nom' => 'Test manager',
            'email' => uniqid('manager-', true) . '@example.test',
            'password' => 'password',
        ]);
    }

    private function grantReportManagement(User $user): void
    {
        $permission = Permission::firstOrCreate(['libelle' => 'gerer_rapports']);
        $user->permissionsDirectes()->attach($permission->id);
    }

    private function createRecipient(
        string $type,
        string $email,
        bool $isActive = true,
        bool $includeAttachments = false,
    ): ReportRecipient {
        return ReportRecipient::create([
            'email' => $email,
            'type' => $type,
            'is_active' => $isActive,
            'include_attachments' => $includeAttachments,
        ]);
    }
}
