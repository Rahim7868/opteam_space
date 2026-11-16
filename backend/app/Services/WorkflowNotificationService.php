<?php

namespace App\Services;

use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\User;
use App\Notifications\WorkflowNotification;

class WorkflowNotificationService
{
    public function fixingSubmitted(Fixing $fixing, User $actor): void
    {
        $this->notifyReviewers(
            ['valider_fixing', 'rejeter_fixing'],
            $actor,
            $this->details(
                'fixing_submitted',
                'Fixing à valider',
                "Le fixing {$fixing->devise} du {$fixing->date_fixing->format('d/m/Y')} attend votre validation.",
                'fixing',
                $fixing->id,
                '/fixings',
            ),
        );
    }

    public function fixingModificationSubmitted(Fixing $fixing, User $actor): void
    {
        $this->notifyReviewers(
            ['approuver_modification_fixing'],
            $actor,
            $this->details(
                'fixing_modification_submitted',
                'Modification de fixing à examiner',
                "Une modification du fixing {$fixing->devise} attend votre examen.",
                'fixing',
                $fixing->id,
                '/fixings',
            ),
        );
    }

    public function fixingDecision(Fixing $fixing, bool $approved): void
    {
        $this->notifyCreator(
            $fixing->created_by,
            $this->details(
                $approved ? 'fixing_approved' : 'fixing_rejected',
                $approved ? 'Fixing approuvé' : 'Fixing rejeté',
                "Votre fixing {$fixing->devise} du {$fixing->date_fixing->format('d/m/Y')} a été ".($approved ? 'approuvé.' : 'rejeté.'),
                'fixing',
                $fixing->id,
                '/fixings',
            ),
        );
    }

    public function fixingModificationDecision(int $proposerId, Fixing $fixing, bool $approved): void
    {
        $this->notifyCreator(
            $proposerId,
            $this->details(
                $approved ? 'fixing_modification_approved' : 'fixing_modification_rejected',
                $approved ? 'Modification de fixing approuvée' : 'Modification de fixing rejetée',
                "Votre modification du fixing {$fixing->devise} a été ".($approved ? 'approuvée.' : 'rejetée.'),
                'fixing',
                $fixing->id,
                '/fixings',
            ),
        );
    }

    public function bureauChangeSubmitted(BureauChange $bureauChange, User $actor): void
    {
        $this->notifyReviewers(
            ['valider_bureau_change'],
            $actor,
            $this->details(
                'bureau_change_submitted',
                'Bureau de change à valider',
                "Le dossier « {$bureauChange->designation} » attend votre validation.",
                'bureau_change',
                $bureauChange->id,
                '/bureau-changes',
            ),
        );
    }

    public function bureauChangeModificationSubmitted(BureauChange $bureauChange, User $actor): void
    {
        $this->notifyReviewers(
            ['approuver_modification_bureau'],
            $actor,
            $this->details(
                'bureau_change_modification_submitted',
                'Modification de bureau à examiner',
                "Une modification du dossier « {$bureauChange->designation} » attend votre examen.",
                'bureau_change',
                $bureauChange->id,
                '/bureau-changes',
            ),
        );
    }

    public function bureauChangeDecision(BureauChange $bureauChange, bool $approved): void
    {
        $this->notifyCreator(
            $bureauChange->created_by,
            $this->details(
                $approved ? 'bureau_change_approved' : 'bureau_change_rejected',
                $approved ? 'Bureau de change approuvé' : 'Bureau de change rejeté',
                "Votre dossier « {$bureauChange->designation} » a été ".($approved ? 'approuvé.' : 'rejeté.'),
                'bureau_change',
                $bureauChange->id,
                '/bureau-changes',
            ),
        );
    }

    public function bureauChangeModificationDecision(int $proposerId, BureauChange $bureauChange, bool $approved): void
    {
        $this->notifyCreator(
            $proposerId,
            $this->details(
                $approved ? 'bureau_change_modification_approved' : 'bureau_change_modification_rejected',
                $approved ? 'Modification de bureau approuvée' : 'Modification de bureau rejetée',
                "Votre modification du dossier « {$bureauChange->designation} » a été ".($approved ? 'approuvée.' : 'rejetée.'),
                'bureau_change',
                $bureauChange->id,
                '/bureau-changes',
            ),
        );
    }

    public function bureauChangesImported(int $count, User $actor): void
    {
        if ($count < 1) {
            return;
        }

        $this->notifyReviewers(
            ['valider_bureau_change'],
            $actor,
            [
                'event' => 'bureau_changes_imported',
                'title' => 'Nouveaux bureaux à valider',
                'message' => "{$count} dossier(s) importé(s) attend(ent) votre validation.",
                'url' => '/bureau-changes',
                'entity_type' => 'bureau_change',
                'entity_id' => null,
            ],
        );
    }

    private function notifyReviewers(array $permissions, User $actor, array $details): void
    {
        $reviewers = User::query()
            ->where('is_active', true)
            ->whereKeyNot($actor->getKey())
            ->with(['role.permissions', 'permissionsDirectes', 'permissionsRetirees'])
            ->get()
            ->filter(fn (User $user) => collect($permissions)->contains(
                fn (string $permission) => $user->hasPermission($permission)
            ));

        $this->send($reviewers, $details);
    }

    private function notifyCreator(int $creatorId, array $details): void
    {
        $creator = User::query()->find($creatorId);

        if ($creator) {
            $this->send(collect([$creator]), $details);
        }
    }

    private function send(iterable $recipients, array $details): void
    {
        foreach ($recipients as $recipient) {
            $recipient->notify(new WorkflowNotification($details));
        }
    }

    private function details(
        string $event,
        string $title,
        string $message,
        string $entityType,
        int $entityId,
        string $url,
    ): array {
        return [
            'event' => $event,
            'title' => $title,
            'message' => $message,
            'url' => $url,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ];
    }
}
