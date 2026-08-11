<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('bureau_changes', function (Blueprint $table) {
            $table->date('date_expiration_agrement')->nullable()->after('numero_agrement');
        });
    }

    public function down()
    {
        Schema::table('bureau_changes', function (Blueprint $table) {
            $table->dropColumn('date_expiration_agrement');
        });
    }
};