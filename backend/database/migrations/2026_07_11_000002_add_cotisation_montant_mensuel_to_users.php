<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->unsignedInteger('cotisation_montant_mensuel')->nullable()->after('date_expiration');
        });

        // Les comptes déjà présents conservent le montant historique.
        DB::table('users')->where('role', 'membre')->update(['cotisation_montant_mensuel' => 20000]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('cotisation_montant_mensuel');
        });
    }
};
