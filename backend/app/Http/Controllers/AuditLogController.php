<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
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
        $query = AuditLog::query()->with('user')->latest();

        if (request('category')) {
            $this->applyCategoryFilter($query, request('category'));
        }

        if (request('action')) {
            $query->where('action', request('action'));
        }

        if (request('entity_type')) {
            $query->where('entity_type', request('entity_type'));
        }

        if (request('user_id')) {
            $query->where('user_id', request('user_id'));
        }

        return AuditLogResource::collection(
            $query->paginate(request('per_page', 15))
        );
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
