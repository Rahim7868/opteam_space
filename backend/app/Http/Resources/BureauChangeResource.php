<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BureauChangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'numero_ordre' => $this->numero_ordre,
            'designation' => $this->designation,
            'numero_agrement' => $this->numero_agrement,
            'representant_legal' => $this->representant_legal,
            'contact' => $this->contact,
            'addresse' => $this->addresse,
            'status' => $this->status,
            'agents_count' => $this->whenCounted('agents'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
