<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FixingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'date_fixing' => $this->date_fixing?->toDateString(),
            'devise'      => $this->devise,
            'cours'       => (float) $this->cours,

            // Pièce jointe
            'piece_jointe'     => $this->piece_jointe,
            'piece_jointe_url' => $this->piece_jointe
                ? Storage::url($this->piece_jointe)
                : null,

            // Statut et traitement
            'statut'      => $this->statut,       // ✏️ status → statut
            'commentaire' => $this->commentaire,   // ✏️ rejection_reason → commentaire

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