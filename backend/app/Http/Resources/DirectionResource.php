<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DirectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'libelle'   => $this->libelle,
            'adresse'   => $this->adresse,
            'telephone' => $this->telephone,
            'email'     => $this->email,

            'agence' => $this->whenLoaded('agence', fn() => [
                'id'      => $this->agence->id,
                'libelle' => $this->agence->libelle,
            ]),

            'departements' => $this->whenLoaded('departements',
                fn() => $this->departements->map(fn($d) => [
                    'id'      => $d->id,
                    'libelle' => $d->libelle,
                ])
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}