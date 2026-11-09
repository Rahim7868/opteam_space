<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        foreach ([
            'supprimer_audit_actions_utilisateurs',
            'supprimer_audit_fixings_bureaux',
            'supprimer_audit_locaux',
            'supprimer_audit_utilisateurs_roles_permissions',
        ] as $permission) {
            DB::table('permissions')->insertOrIgnore([
                'libelle' => $permission,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        // Keep permissions to avoid revoking grants made after migration.
    }
};