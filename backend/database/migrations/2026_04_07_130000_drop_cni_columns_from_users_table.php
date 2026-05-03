<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'cni_recto')) {
                $table->dropColumn('cni_recto');
            }
            if (Schema::hasColumn('users', 'cni_verso')) {
                $table->dropColumn('cni_verso');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'cni_recto')) {
                $table->string('cni_recto')->nullable()->after('photo_profil');
            }
            if (!Schema::hasColumn('users', 'cni_verso')) {
                $table->string('cni_verso')->nullable()->after('cni_recto');
            }
        });
    }
};
