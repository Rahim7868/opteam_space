<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Agence;
use App\Models\Direction;
use App\Models\Departement;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Permissions ────────────────────────────────────
        $permissions = [
            'creer_fixing',
            'modifier_fixing',
            'valider_fixing',
            'rejeter_fixing',
            'creer_bureau_change',
            'modifier_bureau_change',
            'valider_bureau_change',
            'rejeter_bureau_change',
            'gerer_acteurs',
            'gerer_roles',
            'gerer_permissions',
            'gerer_agences',
            'gerer_directions',
            'gerer_departements',
            'gerer_services',
        ];

        $permissionModels = [];
        foreach ($permissions as $libelle) {
            $permissionModels[$libelle] = Permission::create(['libelle' => $libelle]);
        }

        // ── 2. Rôles ──────────────────────────────────────────
        $roleAdmin       = Role::create(['libelle' => 'Admin']);
        $roleAgent       = Role::create(['libelle' => 'Agent']);
        $roleSuperviseur = Role::create(['libelle' => 'Superviseur']);
        $roleControleur  = Role::create(['libelle' => 'Contrôleur']);

        // Admin → toutes les permissions
        $roleAdmin->permissions()->sync(
            collect($permissionModels)->pluck('id')->toArray()
        );

        // Agent → créer et modifier
        $roleAgent->permissions()->sync([
            $permissionModels['creer_fixing']->id,
            $permissionModels['modifier_fixing']->id,
            $permissionModels['creer_bureau_change']->id,
            $permissionModels['modifier_bureau_change']->id,
        ]);

        // Superviseur → valider/rejeter
        $roleSuperviseur->permissions()->sync([
            $permissionModels['creer_fixing']->id,
            $permissionModels['modifier_fixing']->id,
            $permissionModels['valider_fixing']->id,
            $permissionModels['rejeter_fixing']->id,
            $permissionModels['creer_bureau_change']->id,
            $permissionModels['modifier_bureau_change']->id,
            $permissionModels['valider_bureau_change']->id,
            $permissionModels['rejeter_bureau_change']->id,
        ]);

        // Contrôleur → créer et modifier seulement
        $roleControleur->permissions()->sync([
            $permissionModels['creer_fixing']->id,
            $permissionModels['modifier_fixing']->id,
        ]);

        // ── 3. Structure organisationnelle ────────────────────
        $agence = Agence::create([
            'libelle'   => 'Agence Principale',
            'adresse'   => 'Conakry, Guinée',
            'telephone' => '+224 620 000 000',
            'email'     => 'agence@opteam.gn',
        ]);

        $direction = Direction::create([
            'agence_id' => $agence->id,
            'libelle'   => 'Direction Générale',
            'adresse'   => 'Conakry, Guinée',
            'telephone' => '+224 620 000 001',
            'email'     => 'direction@opteam.gn',
        ]);

        $departement = Departement::create([
            'direction_id' => $direction->id,
            'libelle'      => 'Département Change',
            'adresse'      => 'Conakry, Guinée',
            'telephone'    => '+224 620 000 002',
            'email'        => 'change@opteam.gn',
        ]);

        $service = Service::create([
            'departement_id' => $departement->id,
            'libelle'        => 'Service Fixings',
            'adresse'        => 'Conakry, Guinée',
            'telephone'      => '+224 620 000 003',
            'email'          => 'fixings@opteam.gn',
        ]);

        // ── 4. Utilisateurs ───────────────────────────────────

        $admin = User::create([
            'nom'                  => 'Administrateur',
            'email'                => 'admin@opteam.gn',
            'password'             => Hash::make('Admin@1234'),
            'adresse'              => 'Conakry, Guinée',
            'fonction'             => 'Administrateur Système',
            'service_id'           => $service->id,
            'role_id'              => $roleAdmin->id,
            'is_active'            => true,
            'must_change_password' => false,
        ]);

        User::create([
            'nom'                  => 'Mamadou Diallo',
            'email'                => 'mamadou@opteam.gn',
            'password'             => Hash::make('00000000'),
            'adresse'              => 'Conakry, Guinée',
            'fonction'             => 'Agent de Change',
            'service_id'           => $service->id,
            'role_id'              => $roleAgent->id,
            'is_active'            => true,
            'must_change_password' => true,
        ]);

        User::create([
            'nom'                  => 'Fatoumata Camara',
            'email'                => 'fatoumata@opteam.gn',
            'password'             => Hash::make('00000000'),
            'adresse'              => 'Conakry, Guinée',
            'fonction'             => 'Agent de Change',
            'service_id'           => $service->id,
            'role_id'              => $roleAgent->id,
            'is_active'            => true,
            'must_change_password' => true,
        ]);

        User::create([
            'nom'                  => 'Ibrahim Soumah',
            'email'                => 'ibrahim@opteam.gn',
            'password'             => Hash::make('00000000'),
            'adresse'              => 'Conakry, Guinée',
            'fonction'             => 'Superviseur des Opérations',
            'service_id'           => $service->id,
            'role_id'              => $roleSuperviseur->id,
            'is_active'            => true,
            'must_change_password' => true,
        ]);

        // ── 5. Audit log initial ──────────────────────────────
        AuditLog::create([
            'user_id'     => $admin->id,
            'action'      => 'seed',
            'entity_type' => 'System',
            'entity_id'   => null,
            'description' => 'Initialisation de la base de données',
        ]);

        $this->command->info('✅ Base de données initialisée avec succès !');
        $this->command->info('👤 Admin : admin@opteam.gn / Admin@1234');
        $this->command->info('👤 Agents : mamadou@opteam.gn / 00000000');
        $this->command->info('👤 Superviseur : ibrahim@opteam.gn / 00000000');
    }
}