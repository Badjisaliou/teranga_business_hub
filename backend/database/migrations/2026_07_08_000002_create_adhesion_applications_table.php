<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adhesion_applications', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('civilite', 20);
            $table->string('prenom');
            $table->string('nom');
            $table->date('date_naissance');
            $table->string('telephone')->index();
            $table->string('email')->nullable();
            $table->string('pays_residence');
            $table->string('region');
            $table->string('departement');
            $table->string('commune');
            $table->string('numero_cni')->index();
            $table->boolean('conditions_acceptees')->default(false);
            $table->enum('statut', ['draft', 'payment_pending', 'paid', 'failed', 'expired'])->default('draft');
            $table->unsignedBigInteger('montant_adhesion')->default(10000);
            $table->string('payment_reference')->nullable()->unique();
            $table->string('payment_method', 50)->nullable();
            $table->string('payment_channel', 50)->nullable();
            $table->string('failure_reason')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['telephone', 'statut'], 'adhesion_telephone_status_index');
            $table->index(['numero_cni', 'statut'], 'adhesion_cni_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adhesion_applications');
    }
};
