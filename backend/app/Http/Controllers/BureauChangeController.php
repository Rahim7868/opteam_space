<?php

namespace App\Http\Controllers;

use App\Http\Requests\BureauChangeRequest;
use App\Http\Resources\BureauChangeResource;
use App\Models\BureauChange;
use App\Services\AuditLogger;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class BureauChangeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', BureauChange::class);

        $query = BureauChange::query()
            ->latest();

        if (request('search')) {
            $search = request('search');

            $query->where(function ($q) use ($search) {
                $q->where('designation', 'like', "%{$search}%")
                  ->orWhere('numero_agrement', 'like', "%{$search}%")
                  ->orWhere('numero_ordre', 'like', "%{$search}%");
            });
        }

        if (request('status')) {
            $query->where('status', request('status'));
        }

        return BureauChangeResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(BureauChangeRequest $request): BureauChangeResource
    {
        Gate::authorize('create', BureauChange::class);

        $bureauChange = BureauChange::create($request->validated());

        AuditLogger::forModel(
            'bureau_created',
            $bureauChange,
            'Creation bureau de change'
        );

        return new BureauChangeResource($bureauChange);
    }

    public function show(BureauChange $bureauChange): BureauChangeResource
    {
        Gate::authorize('view', $bureauChange);

        return new BureauChangeResource($bureauChange);
    }

    public function update(BureauChangeRequest $request, BureauChange $bureauChange): BureauChangeResource
    {
        Gate::authorize('update', $bureauChange);

        $bureauChange->update($request->validated());

        AuditLogger::forModel(
            'bureau_updated',
            $bureauChange,
            'Modification bureau de change'
        );

        return new BureauChangeResource($bureauChange);
    }

    public function destroy(BureauChange $bureauChange): BureauChangeResource
    {
        Gate::authorize('delete', $bureauChange);

        $bureauChange->update(['status' => 'inactive']);

        AuditLogger::forModel(
            'bureau_deactivated',
            $bureauChange,
            'Desactivation bureau de change'
        );

        return new BureauChangeResource($bureauChange);
    }
}