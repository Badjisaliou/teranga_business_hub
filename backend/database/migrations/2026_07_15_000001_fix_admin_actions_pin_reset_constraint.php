<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(<<<'SQL'
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'admin_actions'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%action%'
    LOOP
        EXECUTE format('ALTER TABLE admin_actions DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$
SQL);

        DB::statement('ALTER TABLE admin_actions ALTER COLUMN action TYPE VARCHAR(50)');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        // The historical constraint cannot be restored safely because older
        // deployments may contain action values no longer used by the app.
    }
};
