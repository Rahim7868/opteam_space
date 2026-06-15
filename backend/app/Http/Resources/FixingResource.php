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
            'id' => $this->id,
            'user_id' => $this->user_id,

            'date_fixing' => $this->date_fixing?->toDateString(),
            'devise' => $this->devise,
            'cours' => (float) $this->cours,

         
            'variation' => $this->variation,

            'piece_jointe' => $this->piece_jointe,
            'piece_jointe_url' => $this->piece_jointe
                ? Storage::url($this->piece_jointe)
                : null,

            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'validated_by' => $this->validated_by,
            'validated_at' => $this->validated_at?->toISOString(),

            'user' => $this->whenLoaded('user'),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}