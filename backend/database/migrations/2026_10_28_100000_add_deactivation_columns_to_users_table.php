<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('motif_desactivation')->nullable()->after('is_active');
            $table->foreignId('desactive_par')
                  ->nullable()
                  ->after('motif_desactivation')
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('desactive_le')->nullable()->after('desactive_par');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['desactive_par']);
            $table->dropColumn(['motif_desactivation', 'desactive_par', 'desactive_le']);
        });
    }
};
