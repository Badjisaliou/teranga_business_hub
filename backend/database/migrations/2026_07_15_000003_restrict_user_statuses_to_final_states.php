<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $legacyStatuses = DB::table('users')
            ->whereNotIn('statut', ['actif', 'bloque'])
            ->distinct()
            ->orderBy('statut')
            ->pluck('statut');

        if ($legacyStatuses->isNotEmpty()) {
            throw new RuntimeException(
                'Migration annulee : statuts utilisateurs historiques presents : '.$legacyStatuses->implode(', ')
            );
        }

        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_statut_check');
            DB::statement("ALTER TABLE users ALTER COLUMN statut SET DEFAULT 'actif'");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_statut_check CHECK (statut IN ('actif', 'bloque'))");

            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY statut ENUM('actif', 'bloque') NOT NULL DEFAULT 'actif'");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_statut_check');
            DB::statement("ALTER TABLE users ALTER COLUMN statut SET DEFAULT 'en_attente'");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_statut_check CHECK (statut IN ('en_attente', 'attente_adhesion', 'actif', 'bloque', 'rejete'))");

            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY statut ENUM('en_attente', 'attente_adhesion', 'actif', 'bloque', 'rejete') NOT NULL DEFAULT 'en_attente'");
        }
    }
};
