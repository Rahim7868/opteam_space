<?php

namespace App\Console\Commands;

use App\Models\ReportRecipient;
use App\Models\Fixing;
use App\Notifications\FixingReport;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\FixingsExport;

class SendWeeklyFixingReport extends Command
{
    protected $signature = 'report:send-weekly-fixings';
    protected $description = 'Envoie les rapports de fixings aux destinataires configurés';

    public function handle(): int
    {
        $dueTypes = [
            'daily' => ['daily', 'daily_weekly'],
        ];

        if (now()->isMonday()) {
            $dueTypes['weekly'] = ['weekly', 'daily_weekly'];
        }

        if (now()->day === 1) {
            $dueTypes['monthly'] = ['monthly'];
        }

        $sent = 0;
        foreach ($dueTypes as $type => $recipientTypes) {
            $recipients = ReportRecipient::query()
                ->whereIn('type', $recipientTypes)
                ->where('is_active', true)
                ->get();

            if ($recipients->isEmpty()) {
                continue;
            }

            [$start, $end] = $this->periodFor($type);
            $fixings = Fixing::query()
                ->with('createur')
                ->whereDate('date_fixing', '>=', $start->toDateString())
                ->whereDate('date_fixing', '<=', $end->toDateString())
                ->orderBy('date_fixing')
                ->orderBy('id')
                ->get();

            if ($fixings->isEmpty()) {
                $this->info("Aucun fixing pour le rapport {$type}; aucun email envoyé.");
                continue;
            }

            $fixings->each(function (Fixing $fixing): void {
                $fixing->variation = $fixing->calculateVariation();
            });

            $summary = $this->summary($fixings);
            $csv = null;
            $excel = null;

            if ($recipients->contains('include_attachments', true)) {
                $csv = $this->csvAttachment($fixings);
                $excel = Excel::raw(
                    new FixingsExport($fixings, now()->format('d/m/Y H:i:s'), 'OPTEAM_SPACE'),
                    \Maatwebsite\Excel\Excel::XLSX
                );
            }

            foreach ($recipients as $recipient) {
                $recipient->notify(new FixingReport(
                    $type,
                    $summary,
                    $fixings,
                    $start->format('d/m/Y'),
                    $end->format('d/m/Y'),
                    $recipient->include_attachments ? $csv : null,
                    $recipient->include_attachments ? $excel : null,
                ));

                $sent++;
                $this->info("Email envoyé à {$recipient->email} ({$type}).");
            }
        }

        $this->info("Rapports envoyés : {$sent}.");

        return Command::SUCCESS;
    }

    private function periodFor(string $type): array
    {
        return match ($type) {
            'daily' => [now()->subDay()->startOfDay(), now()->subDay()->endOfDay()],
            'weekly' => [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()],
            'monthly' => [now()->subMonthNoOverflow()->startOfMonth(), now()->subMonthNoOverflow()->endOfMonth()],
        };
    }

    private function summary(Collection $fixings): array
    {
        return [
            'total' => $fixings->count(),
            'valides' => $fixings->where('statut', 'valide')->count(),
            'en_attente' => $fixings->where('statut', 'en_attente')->count(),
            'rejetes' => $fixings->where('statut', 'rejete')->count(),
            'par_devise' => $fixings->groupBy('devise')
                ->map(fn($g) => $g->count() . ' (' . $g->first()->devise . ')')
                ->implode(', '),
        ];
    }

    private function csvAttachment(Collection $fixings): string
    {
        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            throw new \RuntimeException('Impossible de préparer le fichier CSV du rapport.');
        }

        fwrite($stream, "\xEF\xBB\xBF");
        fputcsv($stream, ['Date', 'Devise', 'Cours', 'Variation', 'Créateur', 'Statut'], ',', '"', '');

        foreach ($fixings as $fixing) {
            fputcsv($stream, [
                $fixing->date_fixing->format('d/m/Y'),
                $this->safeCsvValue($fixing->devise),
                $fixing->cours,
                $fixing->variation ?? 'N/A',
                $this->safeCsvValue($fixing->createur?->nom ?? '—'),
                ucfirst(str_replace('_', ' ', $fixing->statut)),
            ], ',', '"', '');
        }

        rewind($stream);
        $contents = stream_get_contents($stream);
        fclose($stream);

        if ($contents === false) {
            throw new \RuntimeException('Impossible de lire le fichier CSV du rapport.');
        }

        return $contents;
    }

    private function safeCsvValue(string $value): string
    {
        return preg_match('/^[\s]*[=+\-@]/u', $value) === 1
            ? "'{$value}"
            : $value;
    }
}