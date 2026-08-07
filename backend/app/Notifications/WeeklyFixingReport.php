<?php

namespace App\Notifications;

use App\Models\Fixing;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class WeeklyFixingReport extends Notification
{
    protected $summary;
    protected $startDate;
    protected $endDate;

    public function __construct($summary, $startDate, $endDate)
    {
        $this->summary = $summary;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $summary = $this->summary;

        return (new MailMessage)
            ->subject('📊 Rapport hebdomadaire des fixings')
            ->greeting('Bonjour ' . $notifiable->nom . ',')
            ->line('Voici le résumé des fixings de la semaine :')
            ->line('**Du ' . $this->startDate . ' au ' . $this->endDate . '**')
            ->line('')
            ->line("📈 **Total fixings** : {$summary['total']}")
            ->line("✅ **Validés** : {$summary['valides']}")
            ->line("⏳ **En attente** : {$summary['en_attente']}")
            ->line("❌ **Rejetés** : {$summary['rejetes']}")
            ->line('')
            ->line('📋 **Détail par devise** :')
            ->line($summary['par_devise'])
            ->line('')
            ->action('🔗 Voir tous les fixings', url('/'))
            ->line('')
            ->line('Merci de votre confiance !');
    }
}