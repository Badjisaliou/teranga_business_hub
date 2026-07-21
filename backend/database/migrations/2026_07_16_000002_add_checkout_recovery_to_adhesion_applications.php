<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adhesion_applications', function (Blueprint $table) {
            $table->text('checkout_url')->nullable();
            $table->dateTime('payment_expires_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('adhesion_applications', function (Blueprint $table) {
            $table->dropIndex(['payment_expires_at']);
            $table->dropColumn(['checkout_url', 'payment_expires_at']);
        });
    }
};
