<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BureauChangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'designation'        => $this->designation,
            'numero_agrement'    => $this->numero_agrement,
            'representant_legal' => $this->representant_legal,
            'contact'            => $this->contact,
            'adresse'            => $this->adresse,      // ✏️ faute corrigée
            'statut'             => $this->statut,        // ✏️ status → statut
            'commentaire'        => $this->commentaire,   // motif de rejet

            // Qui a créé
            'createur' => $this->whenLoaded('createur', fn() => [
                'id'  => $this->createur->id,
                'nom' => $this->createur->nom,
            ]),

            // Qui a validé/rejeté
            'validateur' => $this->whenLoaded('validateur', fn() => [
                'id'  => $this->validateur->id,
                'nom' => $this->validateur->nom,
            ]),

            // Indique si encore modifiable
            'is_editable' => $this->isEditable(),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}