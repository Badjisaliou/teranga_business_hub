<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'pin_reset_token_hash')) {
                $table->string('pin_reset_token_hash')->nullable()->after('pin_locked_until');
            }

            if (!Schema::hasColumn('users', 'pin_reset_token_expires_at')) {
                $table->dateTime('pin_reset_token_expires_at')->nullable()->after('pin_reset_token_hash');
            }

            if (!Schema::hasColumn('users', 'pin_reset_token_created_at')) {
                $table->dateTime('pin_reset_token_created_at')->nullable()->after('pin_reset_token_expires_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'pin_reset_token_hash',
                'pin_reset_token_expires_at',
                'pin_reset_token_created_at',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
