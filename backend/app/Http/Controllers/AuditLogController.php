<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Exports\AuditLogsExport;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use PDF;

class AuditLogController extends Controller
{
    private const VIEW_PERMISSION = 'consulter_audits';

    private const DELETE_PERMISSIONS = [
        'user-actions' => 'supprimer_audit_actions_utilisateurs',
        'exchange' => 'supprimer_audit_fixings_bureaux',
        'locations' => 'supprimer_audit_locaux',
        'access-control' => 'supprimer_audit_utilisateurs_roles_permissions',
    ];

    private const EXPORT_PERMISSIONS = [
        'user-actions' => [
            'pdf' => 'exporter_audit_actions_utilisateurs_pdf',
            'excel' => 'exporter_audit_actions_utilisateurs_excel',
        ],
        'exchange' => [
            'pdf' => 'exporter_audit_fixings_bureaux_pdf',
            'excel' => 'exporter_audit_fixings_bureaux_excel',
        ],
        'locations' => [
            'pdf' => 'exporter_audit_locaux_pdf',
            'excel' => 'exporter_audit_locaux_excel',
        ],
        'access-control' => [
            'pdf' => 'exporter_audit_utilisateurs_roles_permissions_pdf',
            'excel' => 'exporter_audit_utilisateurs_roles_permissions_excel',
        ],
    ];

    private const CATEGORY_LABELS = [
        'user-actions' => 'Actions des utilisateurs',
        'exchange' => 'Fixings et bureaux de change',
        'locations' => 'Locaux',
        'access-control' => 'Utilisateurs, rôles et permissions',
    ];

    private const CATEGORY_FILTERS = [
        'user-actions' => [
            'actions' => ['login', 'logout', 'password_changed', 'seed'],
            'entities' => ['System'],
        ],
        'exchange' => [
            'action_prefixes' => ['fixing_', 'bureau_'],
            'entities' => ['Fixing', 'BureauChange'],
        ],
        'locations' => [
            'action_prefixes' => ['agence_', 'direction_', 'departement_', 'service_'],
            'entities' => ['Agence', 'Direction', 'Departement', 'Service'],
        ],
        'access-control' => [
            'action_prefixes' => ['user_', 'role_', 'permission_', 'permissions_', 'agent_'],
            'entities' => ['User', 'Role', 'Permission'],
            'exclude_actions' => ['login', 'logout', 'password_changed'],
        ],
    ];

    public function index(): AnonymousResourceCollection
    {
        abort_unless(auth()->user()->hasPermission(self::VIEW_PERMISSION), 403, 'Permission refusée.');

        $query = AuditLog::query()->with('user')->latest();

        // Filtre par categorie
        if (request('category')) {
            $this->applyCategoryFilter($query, request('category'));
        }

        // Filtre par date debut
        if (request('date_debut')) {
            $query->whereDate('created_at', '>=', request('date_debut'));
        }

        // Filtre par date fin
        if (request('date_fin')) {
            $query->whereDate('created_at', '<=', request('date_fin'));
        }

        // Filtre par utilisateur
        if (request('user_id')) {
            $query->where('user_id', request('user_id'));
        }

        return AuditLogResource::collection(
            $query->paginate(request('per_page', 15))
        );
    }

    public function exportPdf(Request $request)
    {
        $filters = $this->validateExportFilters($request);
        $this->authorizeExport($request, $filters['category'], 'pdf');

        $logs = $this->filteredQuery($filters)
            ->with('user')
            ->latest()
            ->get();

        $pdf = PDF::loadView('exports.audit_logs_pdf', [
            'logs' => $logs,
            'categoryLabel' => self::CATEGORY_LABELS[$filters['category']],
            'dateExport' => now()->format('d/m/Y H:i'),
            'total' => $logs->count(),
        ]);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('audit-' . $filters['category'] . '-' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        $filters = $this->validateExportFilters($request);
        $this->authorizeExport($request, $filters['category'], 'excel');

        $logs = $this->filteredQuery($filters)
            ->with('user')
            ->latest()
            ->get();

        return Excel::download(
            new AuditLogsExport($logs),
            'audit-' . $filters['category'] . '-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function destroy(Request $request, AuditLog $auditLog): JsonResponse
    {
        $filters = $this->validateDeleteFilters($request);

        if (!$request->user()->hasPermission(self::DELETE_PERMISSIONS[$filters['category']])) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        if (!$this->filteredQuery($filters)->whereKey($auditLog->id)->exists()) {
            return response()->json(['message' => 'Cette entrée ne correspond pas aux filtres de la catégorie.'], 404);
        }

        $auditLog->delete();

        return response()->json(['message' => 'Entrée d’audit supprimée.']);
    }

    public function destroyMany(Request $request): JsonResponse
    {
        $filters = $this->validateDeleteFilters($request, true);

        if (!$request->user()->hasPermission(self::DELETE_PERMISSIONS[$filters['category']])) {
            return response()->json(['message' => 'Permission refusée.'], 403);
        }

        return DB::transaction(function () use ($filters): JsonResponse {
            $logs = $this->filteredQuery($filters)
                ->whereKey($filters['ids'])
                ->lockForUpdate()
                ->get(['id']);

            if ($logs->count() !== count($filters['ids'])) {
                return response()->json([
                    'message' => 'Une ou plusieurs entrées ne correspondent plus aux filtres actifs.',
                ], 422);
            }

            $deleted = AuditLog::whereKey($logs->modelKeys())->delete();

            return response()->json([
                'message' => $deleted . ' entrée(s) d’audit supprimée(s).',
                'deleted' => $deleted,
            ]);
        });
    }

    private function validateDeleteFilters(Request $request, bool $includeIds = false): array
    {
        $rules = [
            'category' => ['required', Rule::in(array_keys(self::DELETE_PERMISSIONS))],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];

        if ($includeIds) {
            $rules['ids'] = ['required', 'array', 'min:1'];
            $rules['ids.*'] = ['required', 'integer', 'distinct', 'exists:audit_logs,id'];
        }

        return $request->validate($rules);
    }

    private function validateExportFilters(Request $request): array
    {
        return $request->validate([
            'category' => ['required', Rule::in(array_keys(self::CATEGORY_FILTERS))],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);
    }

    private function authorizeExport(Request $request, string $category, string $format): void
    {
        abort_unless(
            $request->user()->hasPermission(self::EXPORT_PERMISSIONS[$category][$format]),
            403,
            'Permission refusée.'
        );
    }

    private function filteredQuery(array $filters): Builder
    {
        $query = AuditLog::query();
        $this->applyCategoryFilter($query, $filters['category']);

        if (!empty($filters['date_debut'])) {
            $query->whereDate('created_at', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->whereDate('created_at', '<=', $filters['date_fin']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query;
    }

    private function applyCategoryFilter($query, string $category): void
    {
        $filter = self::CATEGORY_FILTERS[$category] ?? null;

        if (!$filter) {
            return;
        }

        $query->where(function ($q) use ($filter) {
            if (!empty($filter['actions'])) {
                $q->orWhereIn('action', $filter['actions']);
            }

            if (!empty($filter['entities'])) {
                $q->orWhereIn('entity_type', $filter['entities']);
            }

            foreach ($filter['action_prefixes'] ?? [] as $prefix) {
                $q->orWhere('action', 'like', $prefix . '%');
            }
        });

        if (!empty($filter['exclude_actions'])) {
            $query->whereNotIn('action', $filter['exclude_actions']);
        }
    }
}