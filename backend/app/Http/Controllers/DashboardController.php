<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\BureauChange;
use App\Models\Fixing;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $user = request()->user();

        // ── Fixings ───────────────────────────────────────────
        $fixingsQuery = Fixing::query();

        // Un acteur sans permission de tout voir ne voit que les siens
        if (!$user->hasPermission('valider_fixing')) {
            $fixingsQuery->where('created_by', $user->id);
        }

        // Comptage par statut
        $statuts = (clone $fixingsQuery)
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $payload = [
            // ── Fixings
            'fixings_total'    => (clone $fixingsQuery)->count(),
            'fixings_en_attente' => $statuts['en_attente'] ?? 0,
            'fixings_valides'    => $statuts['valide']     ?? 0,
            'fixings_rejetes'    => $statuts['rejete']     ?? 0,

            // ── Derniers fixings
            'recent_fixings' => (clone $fixingsQuery)
                ->with('createur:id,nom')
                ->latest()
                ->limit(5)
                ->get(),
        ];

        // ── Données supplémentaires selon permissions ─────────

        if ($user->hasPermission('gerer_acteurs')) {
            $payload['acteurs_total']  = User::count();
            $payload['acteurs_actifs'] = User::where('is_active', true)->count();
        }

        if ($user->hasPermission('valider_bureau_change')) {
            $bureauStatuts = BureauChange::query()
                ->select('statut', DB::raw('count(*) as total'))
                ->groupBy('statut')
                ->pluck('total', 'statut');

            $payload['bureaux_total']      = BureauChange::count();
            $payload['bureaux_en_attente'] = $bureauStatuts['en_attente'] ?? 0;
            $payload['bureaux_valides']    = $bureauStatuts['valide']     ?? 0;
            $payload['bureaux_rejetes']    = $bureauStatuts['rejete']     ?? 0;
        }

        if ($user->hasPermission('gerer_acteurs')) {
            $payload['audit_logs_total'] = AuditLog::count();
            $payload['recent_audit_logs'] = AuditLog::query()
                ->with('user:id,nom')
                ->latest()
                ->limit(5)
                ->get();
        }

        return response()->json($payload);
    }
}