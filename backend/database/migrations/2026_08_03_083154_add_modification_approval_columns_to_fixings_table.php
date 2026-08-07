<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('fixings', function (Blueprint $table) {
            $table->string('statut_modification')->nullable()->after('statut');
            $table->foreignId('modification_proposee_par')
                ->nullable()
                ->after('statut_modification')
                ->constrained('users')
                ->nullOnDelete();
            $table->json('modification_proposee')->nullable()->after('modification_proposee_par');
            $table->foreignId('modification_approuvee_par')
                ->nullable()
                ->after('modification_proposee')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('modification_approuvee_at')->nullable()->after('modification_approuvee_par');
        });

        Schema::table('bureau_changes', function (Blueprint $table) {
            $table->string('statut_modification')->nullable()->after('statut');
            $table->foreignId('modification_proposee_par')
                ->nullable()
                ->after('statut_modification')
                ->constrained('users')
                ->nullOnDelete();
            $table->json('modification_proposee')->nullable()->after('modification_proposee_par');
            $table->foreignId('modification_approuvee_par')
                ->nullable()
                ->after('modification_proposee')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('modification_approuvee_at')->nullable()->after('modification_approuvee_par');
        });
    }

    public function down()
    {
        Schema::table('fixings', function (Blueprint $table) {
            $table->dropForeign(['modification_proposee_par']);
            $table->dropForeign(['modification_approuvee_par']);
            $table->dropColumn([
                'statut_modification',
                'modification_proposee_par',
                'modification_proposee',
                'modification_approuvee_par',
                'modification_approuvee_at',
            ]);
        });

        Schema::table('bureau_changes', function (Blueprint $table) {
            $table->dropForeign(['modification_proposee_par']);
            $table->dropForeign(['modification_approuvee_par']);
            $table->dropColumn([
                'statut_modification',
                'modification_proposee_par',
                'modification_proposee',
                'modification_approuvee_par',
                'modification_approuvee_at',
            ]);
        });
    }
};