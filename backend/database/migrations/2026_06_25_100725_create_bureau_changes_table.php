<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bureau_changes', function (Blueprint $table) {
            $table->id();
            $table->string('designation');
            $table->string('numero_agrement')->unique();
            $table->string('representant_legal');
            $table->string('contact')->nullable();
            $table->string('adresse')->nullable();
            $table->enum('statut', ['en_attente', 'valide', 'rejete'])
                  ->default('en_attente');
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('validated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bureau_changes');
    }
};