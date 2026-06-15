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

        $fixings = Fixing::query();

        if ($user->isAgent()) {
            $fixings->where('user_id', $user->id);
        }

        $status = (clone $fixings)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $payload = [
            'fixings_total' => (clone $fixings)->count(),
            'fixings_pending' => $status['pending'] ?? 0,
            'fixings_approved' => $status['approved'] ?? 0,
            'fixings_rejected' => $status['rejected'] ?? 0,

            'recent_fixings' => (clone $fixings)
                ->with(['user'])
                ->latest()
                ->limit(5)
                ->get(),
        ];

        if ($user->isAdmin()) {
            $payload['agents_total'] = User::where('role', 'agent')->count();
            $payload['bureaux_total'] = BureauChange::count();
            $payload['audit_logs_total'] = AuditLog::count();
        }

        return response()->json($payload);
    }
}