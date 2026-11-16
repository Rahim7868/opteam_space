<?php

namespace Tests\Feature;

use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\Permission;
use App\Models\User;
use App\Notifications\WorkflowNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_fixing_submission_notifies_active_reviewers_with_relevant_permissions(): void
    {
        $author = $this->userWithPermissions('Author');
        $reviewer = $this->userWithPermissions('Reviewer', ['valider_fixing']);
        $otherReviewer = $this->userWithPermissions('Rejector', ['rejeter_fixing']);
        $unrelated = $this->userWithPermissions('Viewer', ['consulter_fixing']);
        $inactiveReviewer = $this->userWithPermissions('Inactive', ['valider_fixing'], false);

        $this->actingAs($author, 'sanctum')
            ->postJson('/api/fixings', [
                'date_fixing' => '2026-11-15',
                'devise' => 'EUR',
                'cours' => 10.84,
            ])
            ->assertSuccessful();

        $this->assertSame('fixing_submitted', $reviewer->notifications()->first()->data['event']);
        $this->assertSame('fixing_submitted', $otherReviewer->notifications()->first()->data['event']);
        $this->assertCount(0, $author->notifications);
        $this->assertCount(0, $unrelated->notifications);
        $this->assertCount(0, $inactiveReviewer->notifications);

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/fixings')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_fixing_approval_notifies_its_creator(): void
    {
        $author = $this->userWithPermissions('Author');
        $reviewer = $this->userWithPermissions('Reviewer', ['valider_fixing']);
        $fixing = Fixing::create([
            'date_fixing' => '2026-11-15',
            'devise' => 'EUR',
            'cours' => 10.84,
            'created_by' => $author->id,
        ]);

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/fixings/{$fixing->id}/valider")
            ->assertOk();

        $this->assertSame('fixing_approved', $author->notifications()->first()->data['event']);
        $this->assertCount(0, $reviewer->notifications);
    }

    public function test_admin_receives_notifications_when_deciding_on_own_fixings(): void
    {
        $admin = $this->userWithPermissions('Admin', ['valider_fixing', 'rejeter_fixing']);
        $toApprove = Fixing::create([
            'date_fixing' => '2026-11-15',
            'devise' => 'EUR',
            'cours' => 10.84,
            'created_by' => $admin->id,
        ]);
        $toReject = Fixing::create([
            'date_fixing' => '2026-11-16',
            'devise' => 'USD',
            'cours' => 9.97,
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/fixings/{$toApprove->id}/valider")
            ->assertOk();
        $this->postJson("/api/fixings/{$toReject->id}/rejeter", [
            'commentaire' => 'Cours incorrect',
        ])->assertOk();

        $events = $admin->notifications()->get()->pluck('data.event')->all();
        $this->assertCount(2, $events);
        $this->assertContains('fixing_approved', $events);
        $this->assertContains('fixing_rejected', $events);
        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('count', 2);
    }

    public function test_bureau_change_submission_and_bulk_approval_notify_reviewers_and_creator(): void
    {
        $author = $this->userWithPermissions('Author');
        $reviewer = $this->userWithPermissions('Reviewer', ['valider_bureau_change']);

        $this->actingAs($author, 'sanctum')
            ->postJson('/api/bureau-changes', [
                'numero_ordre' => 'BC-TEST-01',
                'designation' => 'Bureau Central',
                'numero_agrement' => 'AGR-TEST-01',
                'representant_legal' => 'Représentant',
                'contact' => '622111111',
                'adresse' => 'Conakry',
            ])
            ->assertSuccessful();

        $bureauChange = BureauChange::query()->firstOrFail();
        $this->assertSame('bureau_change_submitted', $reviewer->notifications()->first()->data['event']);

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/bureau-changes')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($reviewer, 'sanctum')
            ->postJson('/api/bureau-changes/valider-en-masse', [
                'ids' => [$bureauChange->id],
            ])
            ->assertOk();

        $this->assertSame('bureau_change_approved', $author->notifications()->first()->data['event']);
    }

    public function test_modification_proposals_notify_approvers_and_proposers(): void
    {
        $author = $this->userWithPermissions('Author');
        $reviewer = $this->userWithPermissions('Reviewer', [
            'approuver_modification_fixing',
            'approuver_modification_bureau',
        ]);
        $fixing = Fixing::create([
            'date_fixing' => '2026-11-15',
            'devise' => 'EUR',
            'cours' => 10.84,
            'created_by' => $author->id,
        ]);
        $bureauChange = BureauChange::create([
            'numero_ordre' => 'BC-TEST-MOD',
            'designation' => 'Bureau Central',
            'numero_agrement' => 'AGR-TEST-MOD',
            'representant_legal' => 'Représentant',
            'contact' => '622111111',
            'adresse' => 'Conakry',
            'created_by' => $author->id,
        ]);

        $this->actingAs($author, 'sanctum')
            ->putJson("/api/fixings/{$fixing->id}", [
                'date_fixing' => '2026-11-15',
                'devise' => 'EUR',
                'cours' => 10.90,
            ])
            ->assertOk();
        $this->putJson("/api/bureau-changes/{$bureauChange->id}", [
            'numero_ordre' => 'BC-TEST-MOD',
            'designation' => 'Bureau Central Modifié',
            'numero_agrement' => 'AGR-TEST-MOD',
            'representant_legal' => 'Représentant',
            'contact' => '622111111',
            'adresse' => 'Conakry',
        ])->assertOk();

        $this->assertSame(
            'fixing_modification_submitted',
            $reviewer->notifications()->where('data->event', 'fixing_modification_submitted')->first()->data['event'],
        );
        $this->assertSame(
            'bureau_change_modification_submitted',
            $reviewer->notifications()->where('data->event', 'bureau_change_modification_submitted')->first()->data['event'],
        );

        $this->actingAs($reviewer, 'sanctum')
            ->postJson("/api/fixings/{$fixing->id}/approuver-modification")
            ->assertOk();
        $this->postJson("/api/bureau-changes/{$bureauChange->id}/approuver-modification")
            ->assertOk();

        $this->assertSame(
            'fixing_modification_approved',
            $author->notifications()->where('data->event', 'fixing_modification_approved')->first()->data['event'],
        );
        $this->assertSame(
            'bureau_change_modification_approved',
            $author->notifications()->where('data->event', 'bureau_change_modification_approved')->first()->data['event'],
        );
    }

    public function test_notification_api_only_lists_and_updates_the_authenticated_users_notifications(): void
    {
        $user = $this->userWithPermissions('Recipient');
        $otherUser = $this->userWithPermissions('Other');
        $user->notify(new WorkflowNotification([
            'event' => 'fixing_approved',
            'title' => 'Fixing approuvé',
            'message' => 'Votre fixing a été approuvé.',
            'url' => '/fixings',
        ]));
        $otherUser->notify(new WorkflowNotification([
            'event' => 'bureau_change_rejected',
            'title' => 'Bureau rejeté',
            'message' => 'Votre dossier a été rejeté.',
            'url' => '/bureau-changes',
        ]));
        $notification = $user->notifications()->firstOrFail();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $notification->id)
            ->assertJsonPath('unread_count', 1);

        $this->patchJson("/api/notifications/{$otherUser->notifications()->first()->id}/read")
            ->assertNotFound();

        $this->patchJson("/api/notifications/{$notification->id}/read")
            ->assertOk();

        $this->assertNotNull($notification->fresh()->read_at);
        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('count', 0);
    }

    private function userWithPermissions(string $name, array $permissions = [], bool $active = true): User
    {
        $user = User::create([
            'nom' => $name,
            'email' => strtolower($name).'-'.uniqid().'@opteam.test',
            'password' => 'password',
            'is_active' => $active,
        ]);

        foreach ($permissions as $permissionName) {
            $permission = Permission::firstOrCreate(['libelle' => $permissionName]);
            $user->permissionsDirectes()->attach($permission->id);
        }

        return $user;
    }
}
