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

            $table->string('numero_ordre')->unique();
            $table->string('designation');
            $table->string('numero_agrement');
            $table->string('representant_legal');
            $table->string('contact');
            $table->string('addresse');

            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bureau_changes');
    }
};