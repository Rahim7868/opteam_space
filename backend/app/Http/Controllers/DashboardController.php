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

        $peutVoirTout = $user->hasPermission('valider_fixing');

        // ── Fixings ───────────────────────────────────────────
        $fixingsQuery = Fixing::query();

        // ✅ Agent → seulement ses propres fixings
        if (!$peutVoirTout) {
            $fixingsQuery->where('created_by', $user->id);
        }

        $statuts = (clone $fixingsQuery)
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $payload = [
            'fixings_total'      => (clone $fixingsQuery)->count(),
            'fixings_en_attente' => $statuts['en_attente'] ?? 0,
            'fixings_valides'    => $statuts['valide']     ?? 0,
            'fixings_rejetes'    => $statuts['rejete']     ?? 0,

            'recent_fixings' => (clone $fixingsQuery)
                ->with('createur:id,nom')
                ->latest()
                ->limit(5)
                ->get(),
        ];

        // ── Stats globales → uniquement si permission gerer_acteurs ──
        if ($user->hasPermission('gerer_acteurs')) {
            $payload['acteurs_total']  = User::count();
            $payload['acteurs_actifs'] = User::where('is_active', true)->count();
            $payload['audit_logs_total'] = AuditLog::count();
            $payload['recent_audit_logs'] = AuditLog::query()
                ->with('user:id,nom')
                ->latest()
                ->limit(5)
                ->get();
        }

        // ── Bureaux de change ────────────────────────────────
        if ($user->hasPermission('valider_bureau_change')) {
            // Superviseur/Admin → tous les bureaux
            $bureauQuery = BureauChange::query();
            $bureauStatuts = (clone $bureauQuery)
                ->select('statut', DB::raw('count(*) as total'))
                ->groupBy('statut')
                ->pluck('total', 'statut');

            $payload['bureaux_total']      = $bureauQuery->count();
            $payload['bureaux_en_attente'] = $bureauStatuts['en_attente'] ?? 0;
            $payload['bureaux_valides']    = $bureauStatuts['valide']     ?? 0;
            $payload['bureaux_rejetes']    = $bureauStatuts['rejete']     ?? 0;

        } elseif ($user->hasPermission('creer_bureau_change')) {
            // Agent → seulement ses propres bureaux de change
            $bureauQuery = BureauChange::where('created_by', $user->id);
            $bureauStatuts = (clone $bureauQuery)
                ->select('statut', DB::raw('count(*) as total'))
                ->groupBy('statut')
                ->pluck('total', 'statut');

            $payload['bureaux_total']      = $bureauQuery->count();
            $payload['bureaux_en_attente'] = $bureauStatuts['en_attente'] ?? 0;
            $payload['bureaux_valides']    = $bureauStatuts['valide']     ?? 0;
            $payload['bureaux_rejetes']    = $bureauStatuts['rejete']     ?? 0;
        }

        return response()->json($payload);
    }
} 