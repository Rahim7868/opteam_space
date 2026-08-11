<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Fixing;
use App\Notifications\WeeklyFixingReport;
use Illuminate\Console\Command;

class SendWeeklyFixingReport extends Command
{
    protected $signature = 'report:send-weekly-fixings';
    protected $description = 'Envoie un rapport hebdomadaire des fixings à tous les utilisateurs actifs';

    public function handle()
    {
        $startOfWeek = now()->subWeek()->startOfWeek();
        $endOfWeek = now()->subWeek()->endOfWeek();

        $this->info('Rapport de la semaine du ' . $startOfWeek->format('d/m/Y') . ' au ' . $endOfWeek->format('d/m/Y'));

        // 🔥 Filtre sur date_fixing, pas sur created_at
        $fixings = Fixing::whereBetween('date_fixing', [$startOfWeek, $endOfWeek])->get();

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

        $this->info('Total : ' . $summary['total']);
        $this->info('Valides : ' . $summary['valides']);
        $this->info('En attente : ' . $summary['en_attente']);
        $this->info('Rejetes : ' . $summary['rejetes']);
        $this->info('Par devise : ' . $summary['par_devise']);

        $users = User::where('is_active', true)->get();

        $this->info('Envoi à ' . $users->count() . ' utilisateurs...');

        $count = 0;
        foreach ($users as $user) {
            $user->notify(new WeeklyFixingReport(
                $summary,
                $fixings,
                $startOfWeek->format('d/m/Y'),
                $endOfWeek->format('d/m/Y')
            ));
            $count++;
            $this->info('Email envoyé à ' . $user->nom . ' (' . $count . '/' . $users->count() . ')');

            if ($count < $users->count()) {
                sleep(3);
            }
        }

        $this->info('Rapport hebdomadaire envoyé avec succès !');

        return Command::SUCCESS;
    }
}