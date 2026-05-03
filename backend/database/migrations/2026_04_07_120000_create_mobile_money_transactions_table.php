<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mobile_money_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['adhesion', 'cotisation']);
            $table->unsignedBigInteger('montant');
            $table->string('reference')->unique();
            $table->enum('methode_paiement', ['wave', 'orange_money']);
            $table->enum('statut', ['en_attente', 'echoue'])->default('en_attente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_money_transactions');
    }
};
