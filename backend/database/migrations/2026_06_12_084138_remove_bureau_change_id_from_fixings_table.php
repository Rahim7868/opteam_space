<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fixings', function (Blueprint $table) {
            $table->dropForeign(['bureau_change_id']);
            $table->dropColumn('bureau_change_id');
        });
    }

    public function down(): void
    {
        Schema::table('fixings', function (Blueprint $table) {
            $table->foreignId('bureau_change_id')
                ->constrained()
                ->cascadeOnDelete();
        });
    }
};