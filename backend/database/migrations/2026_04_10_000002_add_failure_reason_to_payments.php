<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('paiements', 'failure_reason')) {
            Schema::table('paiements', function (Blueprint $table) {
                $table->string('failure_reason')->nullable()->after('statut');
            });
        }

        if (!Schema::hasColumn('mobile_money_transactions', 'failure_reason')) {
            Schema::table('mobile_money_transactions', function (Blueprint $table) {
                $table->string('failure_reason')->nullable()->after('statut');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('paiements', 'failure_reason')) {
            Schema::table('paiements', function (Blueprint $table) {
                $table->dropColumn('failure_reason');
            });
        }

        if (Schema::hasColumn('mobile_money_transactions', 'failure_reason')) {
            Schema::table('mobile_money_transactions', function (Blueprint $table) {
                $table->dropColumn('failure_reason');
            });
        }
    }
};
