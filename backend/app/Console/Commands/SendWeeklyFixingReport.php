<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Fixing;
use App\Notifications\WeeklyFixingReport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendWeeklyFixingReport extends Command
{
    protected $signature = 'report:send-weekly-fixings';
    protected $description = 'Envoie un rapport hebdomadaire des fixings à tous les utilisateurs actifs';

    public function handle()
    {
        $startOfWeek = now()->subWeek()->startOfWeek();
        $endOfWeek = now()->subWeek()->endOfWeek();

        $this->info('📊 Rapport de la semaine du ' . $startOfWeek->format('d/m/Y') . ' au ' . $endOfWeek->format('d/m/Y'));

        $fixings = Fixing::whereBetween('created_at', [$startOfWeek, $endOfWeek])->get();

        if ($fixings->isEmpty()) {
            $this->info('Aucun fixing trouvé pour cette semaine.');
            return Command::SUCCESS;
        }

        $summary = [
            'total' => $fixings->count(),
            'valides' => $fixings->where('statut', 'valide')->count(),
            'en_attente' => $fixings->where('statut', 'en_attente')->count(),
            'rejetes' => $fixings->where('statut', 'rejete')->count(),
            'par_devise' => $fixings->groupBy('devise')
                ->map(fn($g) => $g->count() . ' (' . $g->first()->devise . ')')
                ->implode(', '),
        ];

        $this->info('📈 Total : ' . $summary['total']);
        $this->info('✅ Validés : ' . $summary['valides']);
        $this->info('⏳ En attente : ' . $summary['en_attente']);
        $this->info('❌ Rejetés : ' . $summary['rejetes']);
        $this->info('📋 Par devise : ' . $summary['par_devise']);

        // Récupérer tous les utilisateurs actifs
        $users = User::where('is_active', true)->limit(2)->get();

        $this->info('📧 Envoi à ' . $users->count() . ' utilisateurs...');

        // 🔥 Envoyer un par un avec délai
        $count = 0;
        foreach ($users as $user) {
            $user->notify(new WeeklyFixingReport(
                $summary,
                $startOfWeek->format('d/m/Y'),
                $endOfWeek->format('d/m/Y')
            ));
            $count++;
            $this->info("✅ Email envoyé à {$user->nom} ({$count}/{$users->count()})");
            
            // Attendre 2 secondes entre chaque email pour éviter les limites Mailtrap
            if ($count < $users->count()) {
                sleep(3);
            }
        }

        $this->info('✅ Rapport hebdomadaire envoyé avec succès !');

        return Command::SUCCESS;
    }
}