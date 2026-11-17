<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_recipients', function (Blueprint $table) {
            $table->enum('type', ['daily', 'weekly', 'monthly', 'daily_weekly'])->change();
        });
    }

    public function down(): void
    {
        DB::table('report_recipients')
            ->where('type', 'daily_weekly')
            ->update(['type' => 'daily']);

        Schema::table('report_recipients', function (Blueprint $table) {
            $table->enum('type', ['daily', 'weekly', 'monthly'])->change();
        });
    }
};
