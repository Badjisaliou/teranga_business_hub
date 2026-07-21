<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'civilite')) {
                $table->string('civilite', 20)->nullable()->after('matricule');
            }

            if (!Schema::hasColumn('users', 'date_naissance')) {
                $table->date('date_naissance')->nullable()->after('prenom');
            }

            if (!Schema::hasColumn('users', 'pays_residence')) {
                $table->string('pays_residence')->nullable()->after('adresse');
            }

            if (!Schema::hasColumn('users', 'region')) {
                $table->string('region')->nullable()->after('pays_residence');
            }

            if (!Schema::hasColumn('users', 'departement')) {
                $table->string('departement')->nullable()->after('region');
            }

            if (!Schema::hasColumn('users', 'commune')) {
                $table->string('commune')->nullable()->after('departement');
            }

            if (!Schema::hasColumn('users', 'pin_hash')) {
                $table->string('pin_hash')->nullable()->after('password');
            }

            if (!Schema::hasColumn('users', 'pin_configured_at')) {
                $table->dateTime('pin_configured_at')->nullable()->after('pin_hash');
            }

            if (!Schema::hasColumn('users', 'first_login_completed_at')) {
                $table->dateTime('first_login_completed_at')->nullable()->after('pin_configured_at');
            }

            if (!Schema::hasColumn('users', 'card_token')) {
                $table->string('card_token', 120)->nullable()->unique()->after('date_expiration');
            }

            if (!Schema::hasColumn('users', 'card_issued_at')) {
                $table->dateTime('card_issued_at')->nullable()->after('card_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'card_token')) {
                $table->dropUnique(['card_token']);
            }

            foreach ([
                'civilite',
                'date_naissance',
                'pays_residence',
                'region',
                'departement',
                'commune',
                'pin_hash',
                'pin_configured_at',
                'first_login_completed_at',
                'card_token',
                'card_issued_at',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
