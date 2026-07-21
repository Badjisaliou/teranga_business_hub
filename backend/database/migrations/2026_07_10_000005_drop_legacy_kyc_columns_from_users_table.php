<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['photo_profil', 'kyc_statut'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'photo_profil')) {
                $table->string('photo_profil')->nullable()->after('statut');
            }

            if (!Schema::hasColumn('users', 'kyc_statut')) {
                $table->string('kyc_statut')->default('incomplet')->after('photo_profil');
            }
        });
    }
};
