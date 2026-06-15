<?php

namespace App\Http\Controllers;

use App\Http\Requests\DecisionRequest;
use App\Http\Requests\FixingRequest;
use App\Http\Resources\FixingResource;
use App\Models\Fixing;
use App\Services\AuditLogger;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class FixingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Fixing::class);

        $user = request()->user();

        $query = Fixing::query()
            ->with(['user'])
            ->latest();

        if ($user->isAgent()) {
            $query->where('user_id', $user->id);
        }

        foreach (['devise', 'status', 'user_id'] as $field) {
            if (request()->filled($field)) {
                $query->where($field, request($field));
            }
        }

        if (request()->filled('date')) {
            $query->whereDate('date_fixing', request('date'));
        }

        return FixingResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(FixingRequest $request): FixingResource
    {
        Gate::authorize('create', Fixing::class);

        $data = $request->validated();

        if ($request->hasFile('piece_jointe')) {
            $data['piece_jointe'] = $request
                ->file('piece_jointe')
                ->store('fixings', 'public');
        }

        $data['user_id'] = $request->user()->id;
        $data['status'] = 'pending';

        $fixing = Fixing::create($data);

        AuditLogger::forModel('fixing_created', $fixing, 'Creation fixing');

        return new FixingResource($fixing->load(['user']));
    }

    public function show(Fixing $fixing): FixingResource
    {
        Gate::authorize('view', $fixing);

        return new FixingResource($fixing->load(['user']));
    }

    public function update(FixingRequest $request, Fixing $fixing): FixingResource
    {
        Gate::authorize('update', $fixing);

        // règle métier obligatoire
        if ($fixing->status !== 'pending') {
            abort(403, 'Fixing non modifiable');
        }

        $data = $request->validated();

        if ($request->hasFile('piece_jointe')) {
            $data['piece_jointe'] = $request
                ->file('piece_jointe')
                ->store('fixings', 'public');
        }

        $fixing->update($data);

        AuditLogger::forModel('fixing_updated', $fixing, 'Update fixing');

        return new FixingResource($fixing->load(['user']));
    }

    //  FIX IMPORTANT : approve route standard
    public function approve(Fixing $fixing): FixingResource
    {
        Gate::authorize('decide', $fixing);

        $fixing->update([
            'status' => 'approved',
            'validated_by' => request()->user()->id,
            'validated_at' => now(),
            'rejection_reason' => null,
        ]);

        return new FixingResource($fixing->load(['user']));
    }

    //  FIX IMPORTANT : reject route standard
    public function reject(Fixing $fixing): FixingResource
    {
        Gate::authorize('decide', $fixing);

        request()->validate([
            'rejection_reason' => ['required', 'string', 'max:1000']
        ]);

        $fixing->update([
            'status' => 'rejected',
            'rejection_reason' => request('rejection_reason'),
            'validated_by' => request()->user()->id,
            'validated_at' => now(),
        ]);

        return new FixingResource($fixing->load(['user']));
    }

    //  MODIFICATION REQUEST (MANQUAIT)
    public function requestModification(Fixing $fixing)
    {
        Gate::authorize('update', $fixing);

        if ($fixing->status !== 'pending') {
            abort(403, 'Non modifiable');
        }

        request()->validate([
            'nouvelle_devise' => ['required', 'string'],
            'nouveau_cours' => ['required', 'numeric'],
        ]);

        $fixing->update([
            'devise' => request('nouvelle_devise'),
            'cours' => request('nouveau_cours'),
        ]);

        return new FixingResource($fixing->load(['user']));
    }
}