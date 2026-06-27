<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'libelle'   => $this->libelle,
            'adresse'   => $this->adresse,
            'telephone' => $this->telephone,
            'email'     => $this->email,

            'direction' => $this->whenLoaded('direction', fn() => [
                'id'      => $this->direction->id,
                'libelle' => $this->direction->libelle,
                'agence'  => $this->direction->agence
                    ? ['id' => $this->direction->agence->id,
                       'libelle' => $this->direction->agence->libelle]
                    : null,
            ]),

            'services' => $this->whenLoaded('services',
                fn() => $this->services->map(fn($s) => [
                    'id'      => $s->id,
                    'libelle' => $s->libelle,
                ])
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}