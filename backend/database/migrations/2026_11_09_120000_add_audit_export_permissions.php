<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        foreach ([
            'exporter_audit_actions_utilisateurs_pdf',
            'exporter_audit_actions_utilisateurs_excel',
            'exporter_audit_fixings_bureaux_pdf',
            'exporter_audit_fixings_bureaux_excel',
            'exporter_audit_locaux_pdf',
            'exporter_audit_locaux_excel',
            'exporter_audit_utilisateurs_roles_permissions_pdf',
            'exporter_audit_utilisateurs_roles_permissions_excel',
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