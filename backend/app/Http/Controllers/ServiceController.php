<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = Service::query()
            ->with('departement.direction.agence')
            ->latest();

        if (request('search')) {
            $query->where('libelle', 'like', '%' . request('search') . '%');
        }

        if (request('departement_id')) {
            $query->where('departement_id', request('departement_id'));
        }

        return ServiceResource::collection(
            $query->paginate(request('per_page', 10))
        );
    }

    public function store(ServiceRequest $request): ServiceResource
    {
        $service = Service::create($request->validated());

        AuditLogger::forModel('service_created', $service, 'Création service : ' . $service->libelle);

        return new ServiceResource($service->load('departement.direction.agence'));
    }

    public function show(Service $service): ServiceResource
    {
        return new ServiceResource(
            $service->load('departement.direction.agence', 'users')
        );
    }

    public function update(ServiceRequest $request, Service $service): ServiceResource
    {
        $service->update($request->validated());

        AuditLogger::forModel('service_updated', $service, 'Modification service : ' . $service->libelle);

        return new ServiceResource($service->load('departement.direction.agence'));
    }

    public function destroy(Service $service): JsonResponse
    {
        if ($service->users()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : des acteurs sont rattachés à ce service.'
            ], 422);
        }

        AuditLogger::forModel('service_deleted', $service, 'Suppression service : ' . $service->libelle);

        $service->delete();

        return response()->json(['message' => 'Service supprimé.']);
    }
}
