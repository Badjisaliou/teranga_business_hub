<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('matricule')->unique();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'membre'])->default('membre');
            $table->enum('statut', ['en_attente', 'attente_adhesion', 'actif', 'bloque', 'rejete'])->default('en_attente');
            $table->string('photo_profil')->nullable();
            $table->string('cni_recto')->nullable();
            $table->string('cni_verso')->nullable();
            $table->enum('kyc_statut', ['incomplet', 'complet'])->default('incomplet');
            $table->dateTime('date_adhesion')->nullable();
            $table->dateTime('date_expiration')->nullable();
            $table->string('api_token', 80)->nullable()->unique();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
