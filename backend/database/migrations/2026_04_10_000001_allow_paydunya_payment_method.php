<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE paiements MODIFY methode_paiement VARCHAR(50) NOT NULL");
            DB::statement("ALTER TABLE mobile_money_transactions MODIFY methode_paiement VARCHAR(50) NOT NULL");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_methode_paiement_check");
            DB::statement("ALTER TABLE mobile_money_transactions DROP CONSTRAINT IF EXISTS mobile_money_transactions_methode_paiement_check");
            DB::statement("ALTER TABLE paiements ALTER COLUMN methode_paiement TYPE VARCHAR(50)");
            DB::statement("ALTER TABLE mobile_money_transactions ALTER COLUMN methode_paiement TYPE VARCHAR(50)");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE paiements MODIFY methode_paiement ENUM('wave', 'orange_money') NOT NULL");
            DB::statement("ALTER TABLE mobile_money_transactions MODIFY methode_paiement ENUM('wave', 'orange_money') NOT NULL");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_methode_paiement_check CHECK (methode_paiement IN ('wave', 'orange_money', 'paydunya', 'dexpay'))");
            DB::statement("ALTER TABLE mobile_money_transactions ADD CONSTRAINT mobile_money_transactions_methode_paiement_check CHECK (methode_paiement IN ('wave', 'orange_money', 'paydunya', 'dexpay'))");
        }
    }
};
