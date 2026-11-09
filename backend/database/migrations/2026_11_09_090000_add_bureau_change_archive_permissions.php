<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        foreach ([
            'archiver_bureau_change',
            'restaurer_bureau_change',
            'supprimer_definitivement_bureau_change',
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
        // Keep permission records to avoid revoking grants made after migration.
    }
};