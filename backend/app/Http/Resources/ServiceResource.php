<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'libelle'   => $this->libelle,
            'adresse'   => $this->adresse,
            'telephone' => $this->telephone,
            'email'     => $this->email,

            'departement' => $this->whenLoaded('departement', fn() => [
                'id'        => $this->departement->id,
                'libelle'   => $this->departement->libelle,
                'direction' => $this->departement->direction
                    ? ['id'      => $this->departement->direction->id,
                       'libelle' => $this->departement->direction->libelle,
                       'agence'  => $this->departement->direction->agence
                           ? ['id'      => $this->departement->direction->agence->id,
                              'libelle' => $this->departement->direction->agence->libelle]
                           : null]
                    : null,
            ]),

            'users_count' => $this->whenCounted('users'),
            'created_at'  => $this->created_at?->toISOString(),
        ];
    }
}