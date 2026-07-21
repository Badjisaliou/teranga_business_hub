<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $payDunyaCount = DB::table('paiements')->where('methode_paiement', 'paydunya')->count()
            + DB::table('mobile_money_transactions')->where('methode_paiement', 'paydunya')->count();

        if ($payDunyaCount > 0) {
            throw new RuntimeException("Migration annulee : {$payDunyaCount} paiement(s) PayDunya existent encore.");
        }

        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_methode_paiement_check');
            DB::statement('ALTER TABLE mobile_money_transactions DROP CONSTRAINT IF EXISTS mobile_money_transactions_methode_paiement_check');
            DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_methode_paiement_check CHECK (methode_paiement IN ('wave', 'orange_money', 'dexpay'))");
            DB::statement("ALTER TABLE mobile_money_transactions ADD CONSTRAINT mobile_money_transactions_methode_paiement_check CHECK (methode_paiement IN ('wave', 'orange_money', 'dexpay'))");

            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE paiements MODIFY methode_paiement ENUM('wave', 'orange_money', 'dexpay') NOT NULL");
            DB::statement("ALTER TABLE mobile_money_transactions MODIFY methode_paiement ENUM('wave', 'orange_money', 'dexpay') NOT NULL");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_methode_paiement_check');
            DB::statement('ALTER TABLE mobile_money_transactions DROP CONSTRAINT IF EXISTS mobile_money_transactions_methode_paiement_check');
            DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_methode_paiement_check CHECK (methode_paiement IN ('wave', 'orange_money', 'paydunya', 'dexpay'))");
            DB::statement("ALTER TABLE mobile_money_transactions ADD CONSTRAINT mobile_money_transactions_methode_paiement_check CHECK (methode_paiement IN ('wave', 'orange_money', 'paydunya', 'dexpay'))");

            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE paiements MODIFY methode_paiement ENUM('wave', 'orange_money', 'paydunya', 'dexpay') NOT NULL");
            DB::statement("ALTER TABLE mobile_money_transactions MODIFY methode_paiement ENUM('wave', 'orange_money', 'paydunya', 'dexpay') NOT NULL");
        }
    }
};
