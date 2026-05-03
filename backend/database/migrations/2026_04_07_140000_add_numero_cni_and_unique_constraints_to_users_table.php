<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'numero_cni')) {
                $table->string('numero_cni')->nullable()->after('telephone');
            }

            $table->unique('telephone');
            $table->unique('numero_cni');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['telephone']);
            $table->dropUnique(['numero_cni']);

            if (Schema::hasColumn('users', 'numero_cni')) {
                $table->dropColumn('numero_cni');
            }
        });
    }
};
