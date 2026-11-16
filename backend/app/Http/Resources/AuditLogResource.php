<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'action'      => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id'   => $this->entity_id,
            'description' => $this->description,
            'login_email' => $this->login_email,
            'login_status' => $this->login_status,
            'ip_address' => $this->ip_address,

            // Auteur de l'action
            'user' => $this->whenLoaded('user', fn() => [
                'id'  => $this->user->id,
                'nom' => $this->user->nom,
            ]),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}