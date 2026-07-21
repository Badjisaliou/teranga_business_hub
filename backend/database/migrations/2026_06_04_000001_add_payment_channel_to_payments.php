<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('mobile_money_transactions', 'canal_paiement')) {
            Schema::table('mobile_money_transactions', function (Blueprint $table) {
                $table->string('canal_paiement', 50)->nullable()->after('methode_paiement');
            });
        }

        if (!Schema::hasColumn('paiements', 'canal_paiement')) {
            Schema::table('paiements', function (Blueprint $table) {
                $table->string('canal_paiement', 50)->nullable()->after('methode_paiement');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('mobile_money_transactions', 'canal_paiement')) {
            Schema::table('mobile_money_transactions', function (Blueprint $table) {
                $table->dropColumn('canal_paiement');
            });
        }

        if (Schema::hasColumn('paiements', 'canal_paiement')) {
            Schema::table('paiements', function (Blueprint $table) {
                $table->dropColumn('canal_paiement');
            });
        }
    }
};
