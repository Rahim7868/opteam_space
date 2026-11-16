<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('login_email')->nullable();
            $table->string('login_status', 20)->nullable();
            $table->string('ip_address', 45)->nullable();
        });

        DB::table('permissions')
            ->where('libelle', 'consulter_logs_techniques')
            ->delete();
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['login_email', 'login_status', 'ip_address']);
        });

        $now = now();
        DB::table('permissions')->insertOrIgnore([
            'libelle' => 'consulter_logs_techniques',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $permissionId = DB::table('permissions')
            ->where('libelle', 'consulter_logs_techniques')
            ->value('id');
        $adminRoleId = DB::table('roles')->where('libelle', 'Admin')->value('id');

        if ($permissionId && $adminRoleId) {
            DB::table('permission_role')->insertOrIgnore([
                'role_id' => $adminRoleId,
                'permission_id' => $permissionId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
};
