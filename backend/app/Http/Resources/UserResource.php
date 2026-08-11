<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        // Résolution des libellés pour les modifications proposées
        $modificationProposeeLibelles = [];
        if (!empty($this->modification_proposee) && is_array($this->modification_proposee)) {
            foreach ($this->modification_proposee as $key => $value) {
                if ($key === 'role_id' && $value) {
                    $role = \App\Models\Role::find($value);
                    $modificationProposeeLibelles['role_id'] = $role?->libelle ?? $value;
                } elseif ($key === 'service_id' && $value) {
                    $service = \App\Models\Service::find($value);
                    $modificationProposeeLibelles['service_id'] = $service?->libelle ?? $value;
                } else {
                    $modificationProposeeLibelles[$key] = $value;
                }
            }
        }

        // Libellés des valeurs actuelles (pour comparaison lisible)
        $valeursActuellesLibelles = [
            'nom'        => $this->nom,
            'email'      => $this->email,
            'adresse'    => $this->adresse,
            'fonction'   => $this->fonction,
            'role_id'    => $this->role?->libelle ?? '—',
            'service_id' => $this->service?->libelle ?? '—',
        ];

        return [
            'id'                   => $this->id,
            'nom'                  => $this->nom,
            'email'                => $this->email,
            'adresse'              => $this->adresse,
            'fonction'             => $this->fonction,
            'role_id'              => $this->role_id,
            'service_id'           => $this->service_id,
            'is_active'            => $this->is_active,
            'must_change_password' => $this->must_change_password,

            // Nouveaux champs pour les modifications
            'statut_modification'            => $this->statut_modification,
            'modification_proposee'          => $this->modification_proposee,
            'modification_proposee_libelles' => $modificationProposeeLibelles,
            'valeurs_actuelles_libelles'     => $valeursActuellesLibelles,
            'modification_proposee_par'      => $this->modification_proposee_par,
            'modification_proposee_par_nom'  => $this->whenLoaded('modificationProposeePar', fn() => $this->modificationProposeePar?->nom),
            'modification_approuvee_par'     => $this->modification_approuvee_par,
            'modification_approuvee_par_nom' => $this->whenLoaded('modificationApprouveePar', fn() => $this->modificationApprouveePar?->nom),
            'modification_approuvee_at'      => $this->modification_approuvee_at,

            // Rôle avec ses permissions (pour pré-cocher dans le modal)
            'role' => $this->whenLoaded('role', fn() => [
                'id'          => $this->role->id,
                'libelle'     => $this->role->libelle,
                'permissions' => $this->role->permissions->map(fn($p) => [
                    'id'      => $p->id,
                    'libelle' => $p->libelle,
                ]),
            ]),

            // Hiérarchie via service
            'service'     => $this->whenLoaded('service', fn() => [
                'id'      => $this->service->id,
                'libelle' => $this->service->libelle,
            ]),
            'departement' => $this->departement?->libelle,
            'direction'   => $this->direction?->libelle,
            'agence'      => $this->agence?->libelle,

            // Hiérarchie complète avec IDs
            'hierarchie' => $this->service ? [
                'agence_id'      => $this->service->departement?->direction?->agence_id,
                'direction_id'   => $this->service->departement?->direction_id,
                'departement_id' => $this->service->departement_id,
                'service_id'     => $this->service->id,
            ] : null,

            // Permissions directes (ajoutées manuellement à cet acteur)
            'permissions' => $this->whenLoaded('permissionsDirectes',
                fn() => $this->permissionsDirectes->pluck('libelle')
            ),

            // Permissions retirées individuellement à cet acteur
            'permissions_retirees' => $this->whenLoaded('permissionsRetirees',
                fn() => $this->permissionsRetirees->pluck('libelle')
            ),

            // Toutes les permissions effectives : (rôle ∪ directes) − retirées
            'toutes_permissions' => array_values(
                $this->toutesLesPermissions()->toArray()
            ),
        ];
    }
}