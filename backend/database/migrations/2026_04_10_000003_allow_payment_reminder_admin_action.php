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
            DB::statement("ALTER TABLE admin_actions MODIFY action ENUM('blocage', 'deblocage', 'relance_paiement', 'pin_reset_link') NOT NULL");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE admin_actions ALTER COLUMN action TYPE VARCHAR(50)");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE admin_actions MODIFY action ENUM('blocage', 'deblocage') NOT NULL");
        }
    }
};
