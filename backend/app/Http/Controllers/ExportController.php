<?php

namespace App\Http\Controllers;

use App\Models\Fixing;
use App\Models\BureauChange;
use Illuminate\Http\Request;
use PDF;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
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

        $data = [
            'fixings' => $fixings,
            'date_export' => now()->format('d/m/Y H:i'),
            'total' => $fixings->count(),
        ];

        $pdf = PDF::loadView('exports.fixings_pdf', $data);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('fixings_' . now()->format('Y-m-d') . '.pdf');
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

        return Excel::download(
            new \App\Exports\FixingsExport($fixings),
            'fixings_' . now()->format('Y-m-d') . '.xlsx'
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

        $data = [
            'bureauChanges' => $bureauChanges,
            'date_export' => now()->format('d/m/Y H:i'),
            'total' => $bureauChanges->count(),
        ];

        $pdf = PDF::loadView('exports.bureau_changes_pdf', $data);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('bureaux_change_' . now()->format('Y-m-d') . '.pdf');
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

        return Excel::download(
            new \App\Exports\BureauChangesExport($bureauChanges),
            'bureaux_change_' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}