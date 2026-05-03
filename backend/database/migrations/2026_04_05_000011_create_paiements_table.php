<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('cotisation_id')->nullable()->constrained('cotisations')->nullOnDelete();
            $table->enum('type', ['adhesion', 'cotisation']);
            $table->unsignedBigInteger('montant');
            $table->string('reference')->unique();
            $table->enum('methode_paiement', ['wave', 'orange_money']);
            $table->enum('statut', ['en_attente', 'succes', 'echoue'])->default('en_attente');
            $table->dateTime('date_paiement')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
