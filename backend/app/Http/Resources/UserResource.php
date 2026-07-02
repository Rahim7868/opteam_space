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

            // Permissions directes (ajoutées manuellement à cet acteur)
            'permissions' => $this->whenLoaded('permissionsDirectes',
                fn() => $this->permissionsDirectes->pluck('libelle')
            ),

            // Hiérarchie complète avec IDs pour le formulaire dépendant
            'hierarchie' => $this->service ? [
                'agence_id'      => $this->service->departement?->direction?->agence_id,
                'direction_id'   => $this->service->departement?->direction_id,
                'departement_id' => $this->service->departement_id,
                'service_id'     => $this->service->id,
            ] : null,

            // Permissions retirées individuellement à cet acteur
            'permissions_retirees' => $this->whenLoaded('permissionsRetirees',
                fn() => $this->permissionsRetirees->pluck('libelle')
            ),

            // Toutes les permissions effectives : (rôle ∪ directes) − retirées
            'toutes_permissions' => array_values($this->toutesLesPermissions()->toArray()),
        ];
    }
}