<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = AuditLog::query()->with('user')->latest();

        if (request('action')) {
            $query->where('action', request('action'));
        }

        if (request('user_id')) {
            $query->where('user_id', request('user_id'));
        }

        return AuditLogResource::collection(
            $query->paginate(request('per_page', 15))
        );
    }
}