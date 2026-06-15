<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgentRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class AgentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        $query = User::query()->where('role', 'agent')->latest();

        if (request('search')) {
            $search = request('search');
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        if (request('status')) {
            $query->where('status', request('status'));
        }


        return UserResource::collection($query->paginate(request('per_page', 10)));
    }

    public function store(AgentRequest $request): UserResource
    {
        Gate::authorize('create', User::class);

        $agent = User::create($request->safe()->merge([
            'role' => 'agent',
            'status' => $request->input('status', 'active'),
        ])->all());

        AuditLogger::forModel('agent_created', $agent, 'Creation agent');

        return new UserResource($agent);
    }

    public function show(User $agent): UserResource
    {
        abort_unless($agent->role === 'agent', 404);
        Gate::authorize('view', $agent);

        return new UserResource($agent);
    }

    public function update(AgentRequest $request, User $agent): UserResource
    {
        abort_unless($agent->role === 'agent', 404);
        Gate::authorize('update', $agent);

        $data = $request->validated();
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $agent->update($data);
        AuditLogger::forModel('agent_updated', $agent, 'Modification agent');

        return new UserResource($agent);
    }

    public function destroy(User $agent): UserResource
    {
        abort_unless($agent->role === 'agent', 404);
        Gate::authorize('delete', $agent);

        $agent->update(['status' => 'inactive']);
        AuditLogger::forModel('agent_deactivated', $agent, 'Desactivation agent');

        return new UserResource($agent);
    }
}
