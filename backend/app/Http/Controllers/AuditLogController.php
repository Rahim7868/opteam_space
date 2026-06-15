<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class AuditLogController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', AuditLog::class);

        $query = AuditLog::query()->with('user')->latest();

        if (request('action')) {
            $query->where('action', request('action'));
        }

        if (request('entity_type')) {
            $query->where('entity_type', request('entity_type'));
        }

        return AuditLogResource::collection($query->paginate(request('per_page', 15)));
    }
}
