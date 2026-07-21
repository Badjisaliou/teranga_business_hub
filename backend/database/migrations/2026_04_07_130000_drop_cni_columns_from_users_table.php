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
        // KYC document uploads are intentionally not restored in the refactored model.
    }
};
