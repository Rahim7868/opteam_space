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

            //Variation calculée dynamiquement
            'variation' => isset($this->variation)
                ? (float) $this->variation
                : null,

            // Pièce jointe
            'piece_jointe'     => $this->piece_jointe,
            'piece_jointe_url' => $this->piece_jointe
                ? Storage::disk('public')->url($this->piece_jointe)
                : null,

            'statut'      => $this->statut,
            'commentaire' => $this->commentaire,

            'createur' => $this->whenLoaded('createur', fn() => [
                'id'  => $this->createur->id,
                'nom' => $this->createur->nom,
            ]),

            'validateur' => $this->whenLoaded('validateur', fn() => [
                'id'  => $this->validateur->id,
                'nom' => $this->validateur->nom,
            ]),

            'is_editable' => $this->isEditable(),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}