<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('permissions')->insertOrIgnore([
            'libelle' => 'consulter_audits',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $permissionId = DB::table('permissions')
            ->where('libelle', 'consulter_audits')
            ->value('id');
        $adminRoleId = DB::table('roles')
            ->where('libelle', 'Admin')
            ->value('id');

        if ($permissionId && $adminRoleId) {
            DB::table('permission_role')->insertOrIgnore([
                'role_id' => $adminRoleId,
                'permission_id' => $permissionId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        // Keep the permission and its grants to avoid revoking access unexpectedly.
    }
};