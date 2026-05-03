<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('mois');
            $table->unsignedSmallInteger('annee');
            $table->unsignedBigInteger('montant_paye')->default(0);
            $table->enum('statut', ['non_paye', 'partiel', 'a_jour', 'en_retard'])->default('non_paye');
            $table->timestamps();

            $table->unique(['user_id', 'mois', 'annee']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotisations');
    }
};
