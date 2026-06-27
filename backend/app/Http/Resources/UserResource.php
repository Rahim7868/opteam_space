<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'nom'                  => $this->nom,
            'email'                => $this->email,
            'adresse'              => $this->adresse,
            'is_active'            => $this->is_active,
            'must_change_password' => $this->must_change_password,

            // Rôle
            'role' => $this->whenLoaded('role', fn() => [
                'id'      => $this->role->id,
                'libelle' => $this->role->libelle,
            ]),

            // Hiérarchie via service
            'service'     => $this->whenLoaded('service', fn() => [
                'id'      => $this->service->id,
                'libelle' => $this->service->libelle,
            ]),
            'departement' => $this->departement?->libelle,
            'direction'   => $this->direction?->libelle,
            'agence'      => $this->agence?->libelle,

            // Permissions directes
            'permissions' => $this->whenLoaded('permissionsDirectes',
                fn() => $this->permissionsDirectes->pluck('libelle')
            ),

            // Toutes les permissions (rôle + directes)
            'toutes_permissions' => $this->toutesLesPermissions(),
        ];
    }
}