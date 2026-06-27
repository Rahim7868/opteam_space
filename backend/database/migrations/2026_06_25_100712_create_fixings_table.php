<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixings', function (Blueprint $table) {
            $table->id();
            $table->date('date_fixing');
            $table->string('devise');
            $table->decimal('cours', 15, 6);
            $table->string('piece_jointe')->nullable();
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
        Schema::dropIfExists('fixings');
    }
};