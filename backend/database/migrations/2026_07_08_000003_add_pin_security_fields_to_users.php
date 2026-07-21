<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'pin_setup_token_hash')) {
                $table->string('pin_setup_token_hash')->nullable()->after('first_login_completed_at');
            }

            if (!Schema::hasColumn('users', 'pin_setup_token_expires_at')) {
                $table->dateTime('pin_setup_token_expires_at')->nullable()->after('pin_setup_token_hash');
            }

            if (!Schema::hasColumn('users', 'pin_failed_attempts')) {
                $table->unsignedTinyInteger('pin_failed_attempts')->default(0)->after('pin_setup_token_expires_at');
            }

            if (!Schema::hasColumn('users', 'pin_locked_until')) {
                $table->dateTime('pin_locked_until')->nullable()->after('pin_failed_attempts');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'pin_setup_token_hash',
                'pin_setup_token_expires_at',
                'pin_failed_attempts',
                'pin_locked_until',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
