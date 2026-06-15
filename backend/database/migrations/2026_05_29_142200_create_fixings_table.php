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

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bureau_change_id')->constrained()->cascadeOnDelete();

            $table->date('date_fixing');
            $table->string('devise');
            $table->decimal('cours', 10, 4);

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->unsignedBigInteger('validated_by')->nullable();
            $table->timestamp('validated_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fixings');
    }
};