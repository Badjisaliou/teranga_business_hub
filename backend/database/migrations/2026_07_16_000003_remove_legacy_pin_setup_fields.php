<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'pin_setup_token_hash',
                'pin_setup_token_expires_at',
                'first_login_completed_at',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dateTime('first_login_completed_at')->nullable()->after('pin_configured_at');
            $table->string('pin_setup_token_hash')->nullable()->after('first_login_completed_at');
            $table->dateTime('pin_setup_token_expires_at')->nullable()->after('pin_setup_token_hash');
        });
    }
};
