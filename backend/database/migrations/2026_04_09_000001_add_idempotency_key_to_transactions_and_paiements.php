<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mobile_money_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('mobile_money_transactions', 'idempotency_key')) {
                $table->string('idempotency_key', 120)->nullable()->after('reference');
            }

            $table->unique(['user_id', 'idempotency_key'], 'mmt_user_idempotency_unique');
        });

        Schema::table('paiements', function (Blueprint $table) {
            if (!Schema::hasColumn('paiements', 'idempotency_key')) {
                $table->string('idempotency_key', 120)->nullable()->after('reference');
            }

            $table->unique(['user_id', 'idempotency_key'], 'paiements_user_idempotency_unique');
        });
    }

    public function down(): void
    {
        Schema::table('mobile_money_transactions', function (Blueprint $table) {
            $table->dropUnique('mmt_user_idempotency_unique');

            if (Schema::hasColumn('mobile_money_transactions', 'idempotency_key')) {
                $table->dropColumn('idempotency_key');
            }
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->dropUnique('paiements_user_idempotency_unique');

            if (Schema::hasColumn('paiements', 'idempotency_key')) {
                $table->dropColumn('idempotency_key');
            }
        });
    }
};
