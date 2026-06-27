<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'libelle'   => $this->libelle,
            'adresse'   => $this->adresse,
            'telephone' => $this->telephone,
            'email'     => $this->email,

            'directions_count' => $this->whenCounted('directions'),
            'directions'       => $this->whenLoaded('directions',
                fn() => $this->directions->map(fn($d) => [
                    'id'      => $d->id,
                    'libelle' => $d->libelle,
                ])
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}