<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Intentionally empty. Test accounts belong in development seeders,
        // never in structural migrations that also run in production.
    }

    public function down(): void
    {
        // Intentionally empty: this migration no longer owns user data.
    }
};
