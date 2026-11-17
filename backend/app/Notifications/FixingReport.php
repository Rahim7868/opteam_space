<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FixingReport extends Notification
{
    public function __construct(
        private readonly string $type,
        private readonly array $summary,
        private readonly mixed $fixings,
        private readonly string $startDate,
        private readonly string $endDate,
        private readonly ?string $csvAttachment = null,
        private readonly ?string $excelAttachment = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $labels = [
            'daily' => 'quotidien',
            'weekly' => 'hebdomadaire',
            'monthly' => 'mensuel',
        ];
        $label = $labels[$this->type];

        $message = (new MailMessage)
            ->subject("Rapport {$label} des fixings")
            ->view('emails.fixing_report', [
                'notifiable' => $notifiable,
                'summary' => $this->summary,
                'fixings' => $this->fixings,
                'startDate' => $this->startDate,
                'endDate' => $this->endDate,
                'frequencyLabel' => ucfirst($label),
            ]);

        if ($this->csvAttachment !== null) {
            $message->attachData($this->csvAttachment, 'fixings.csv', [
                'mime' => 'text/csv; charset=UTF-8',
            ]);
        }

        if ($this->excelAttachment !== null) {
            $message->attachData($this->excelAttachment, 'fixings.xlsx', [
                'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        }

        return $message;
    }
}
