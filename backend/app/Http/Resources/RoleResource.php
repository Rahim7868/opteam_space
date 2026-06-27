<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'libelle' => $this->libelle,

            // Permissions cochées pour ce rôle
            'permissions' => $this->whenLoaded('permissions',
                fn() => $this->permissions->map(fn($p) => [
                    'id'      => $p->id,
                    'libelle' => $p->libelle,
                ])
            ),

            // Nombre d'acteurs avec ce rôle
            'users_count' => $this->whenCounted('users'),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}