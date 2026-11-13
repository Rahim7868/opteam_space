<?php

namespace App\Http\Controllers;

use App\Models\Fixing;
use App\Models\BureauChange;
use DateTimeZone;
use Illuminate\Http\Request;
use PDF;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    private function exportMetadata(Request $request): array
    {
        $requestedTimezone = $request->input('timezone');
        $timezone = is_string($requestedTimezone)
            && in_array($requestedTimezone, DateTimeZone::listIdentifiers(DateTimeZone::ALL_WITH_BC), true)
                ? $requestedTimezone
                : config('app.timezone');
        $exportedAt = now()->setTimezone($timezone);

        return [
            'date_export' => $exportedAt->format('d/m/Y H:i:s'),
            'auteur_export' => auth()->user()->nom,
            'filename_date' => $exportedAt->format('Y-m-d'),
        ];
    }

    // EXPORT FIXINGS PDF
    public function exportFixingsPdf(Request $request)
    {
        $query = Fixing::query()
            ->with('createur', 'validateur')
            ->latest();

        // Filtres
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        if ($request->devise) {
            $query->where('devise', $request->devise);
        }

        // Nouveau : filtre par créateur
        if ($request->createur_id) {
            $query->where('created_by', $request->createur_id);
        }

        // Nouveau : filtre par tranche de dates
        if ($request->date_debut) {
            $query->whereDate('date_fixing', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('date_fixing', '<=', $request->date_fin);
        }

        // Permission "consulter_fixing"
        if (!auth()->user()->hasPermission('consulter_fixing')) {
            $query->where('created_by', auth()->id());
        }

        $fixings = $query->get();

        // Calcul de la variation
        $fixings->transform(function ($fixing) {
            $precedent = Fixing::where('devise', $fixing->devise)
                ->where('date_fixing', '<', $fixing->date_fixing)
                ->orderBy('date_fixing', 'desc')
                ->first();

            $fixing->variation = $precedent
                ? round((float) $fixing->cours - (float) $precedent->cours, 6)
                : null;

            return $fixing;
        });

        $metadata = $this->exportMetadata($request);
        $data = [
            'fixings' => $fixings,
            'date_export' => $metadata['date_export'],
            'auteur_export' => $metadata['auteur_export'],
            'total' => $fixings->count(),
        ];

        $pdf = PDF::loadView('exports.fixings_pdf', $data);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('fixings_' . $metadata['filename_date'] . '.pdf');
    }

    // EXPORT FIXINGS EXCEL
    public function exportFixingsExcel(Request $request)
    {
        $query = Fixing::query()
            ->with('createur', 'validateur')
            ->latest();

        // Filtres
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        if ($request->devise) {
            $query->where('devise', $request->devise);
        }

        // Nouveau : filtre par créateur
        if ($request->createur_id) {
            $query->where('created_by', $request->createur_id);
        }

        // Nouveau : filtre par tranche de dates
        if ($request->date_debut) {
            $query->whereDate('date_fixing', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('date_fixing', '<=', $request->date_fin);
        }

        // Permission "consulter_fixing"
        if (!auth()->user()->hasPermission('consulter_fixing')) {
            $query->where('created_by', auth()->id());
        }

        $fixings = $query->get();

        // Calcul de la variation
        $fixings->transform(function ($fixing) {
            $precedent = Fixing::where('devise', $fixing->devise)
                ->where('date_fixing', '<', $fixing->date_fixing)
                ->orderBy('date_fixing', 'desc')
                ->first();

            $fixing->variation = $precedent
                ? round((float) $fixing->cours - (float) $precedent->cours, 6)
                : null;

            return $fixing;
        });

        $metadata = $this->exportMetadata($request);

        return Excel::download(
            new \App\Exports\FixingsExport(
                $fixings,
                $metadata['date_export'],
                $metadata['auteur_export']
            ),
            'fixings_' . $metadata['filename_date'] . '.xlsx'
        );
    }

    // EXPORT BUREAUX DE CHANGE PDF
    public function exportBureauChangesPdf(Request $request)
    {
        $query = BureauChange::query()
            ->with('createur', 'validateur')
            ->latest();

        // Filtres
        if ($request->search) {
            $search = $request->search;
            $query->where(fn($q) => $q
                ->where('numero_ordre', 'like', "%{$search}%")
                ->orWhere('designation', 'like', "%{$search}%")
                ->orWhere('numero_agrement', 'like', "%{$search}%")
                ->orWhere('adresse', 'like', "%{$search}%")
            );
        }

        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        // Nouveau : filtre par créateur
        if ($request->createur_id) {
            $query->where('created_by', $request->createur_id);
        }

        // Nouveau : filtre par tranche de dates
        if ($request->date_debut) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        // Permission "consulter_bureau_change"
        if (!auth()->user()->hasPermission('consulter_bureau_change')) {
            $query->where('created_by', auth()->id());
        }

        $bureauChanges = $query->get();

        $metadata = $this->exportMetadata($request);
        $data = [
            'bureauChanges' => $bureauChanges,
            'date_export' => $metadata['date_export'],
            'auteur_export' => $metadata['auteur_export'],
            'total' => $bureauChanges->count(),
        ];

        $pdf = PDF::loadView('exports.bureau_changes_pdf', $data);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('bureaux_change_' . $metadata['filename_date'] . '.pdf');
    }

    // EXPORT BUREAUX DE CHANGE EXCEL
    public function exportBureauChangesExcel(Request $request)
    {
        $query = BureauChange::query()
            ->with('createur', 'validateur')
            ->latest();

        // Filtres
        if ($request->search) {
            $search = $request->search;
            $query->where(fn($q) => $q
                ->where('numero_ordre', 'like', "%{$search}%")
                ->orWhere('designation', 'like', "%{$search}%")
                ->orWhere('numero_agrement', 'like', "%{$search}%")
                ->orWhere('adresse', 'like', "%{$search}%")
            );
        }

        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        // Nouveau : filtre par créateur
        if ($request->createur_id) {
            $query->where('created_by', $request->createur_id);
        }

        // Nouveau : filtre par tranche de dates
        if ($request->date_debut) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        // Permission "consulter_bureau_change"
        if (!auth()->user()->hasPermission('consulter_bureau_change')) {
            $query->where('created_by', auth()->id());
        }

        $bureauChanges = $query->get();

        $metadata = $this->exportMetadata($request);

        return Excel::download(
            new \App\Exports\BureauChangesExport(
                $bureauChanges,
                $metadata['date_export'],
                $metadata['auteur_export']
            ),
            'bureaux_change_' . $metadata['filename_date'] . '.xlsx'
        );
    }
}