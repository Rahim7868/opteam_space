<?php

namespace App\Notifications;

use App\Models\Fixing;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class WeeklyFixingReport extends Notification
{
    protected $summary;
    protected $fixings;
    protected $startDate;
    protected $endDate;

    public function __construct($summary, $fixings, $startDate, $endDate)
    {
        $this->summary = $summary;
        $this->fixings = $fixings;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Rapport hebdomadaire des fixings')
            ->view('emails.weekly_fixing_report', [
                'notifiable' => $notifiable,
                'summary' => $this->summary,
                'fixings' => $this->fixings,
                'startDate' => $this->startDate,
                'endDate' => $this->endDate,
            ]);
    }
}