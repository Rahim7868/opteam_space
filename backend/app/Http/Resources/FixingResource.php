<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FixingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // 🔥 Récupérer modification_proposee (déjà casté en array dans le modèle)
        $proposed = $this->modification_proposee;

        // 🔥 Si c'est un tableau et qu'il contient un fichier, ajouter l'URL
        if (is_array($proposed) && isset($proposed['piece_jointe']) && $proposed['piece_jointe']) {
            $proposed['piece_jointe_url'] = Storage::disk('public')->url($proposed['piece_jointe']);
        }

        return [
            'id'          => $this->id,
            'date_fixing' => $this->date_fixing?->toDateString(),
            'devise'      => $this->devise,
            'cours'       => (float) $this->cours,

            'variation' => isset($this->variation)
                ? (float) $this->variation
                : null,

            'piece_jointe'     => $this->piece_jointe,
            'piece_jointe_url' => $this->piece_jointe
                ? Storage::disk('public')->url($this->piece_jointe)
                : null,

            'statut'      => $this->statut,
            'commentaire' => $this->commentaire,

            'statut_modification' => $this->statut_modification,
            'modification_proposee' => $proposed,
            'modification_proposee_par' => $this->modification_proposee_par,
            'modification_proposee_par_nom' => $this->whenLoaded('modificationProposeePar', fn() => $this->modificationProposeePar?->nom),
            'modification_approuvee_par' => $this->modification_approuvee_par,
            'modification_approuvee_par_nom' => $this->whenLoaded('modificationApprouveePar', fn() => $this->modificationApprouveePar?->nom),
            'modification_approuvee_at' => $this->modification_approuvee_at,

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