<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('phone_verification_codes');

        if (Schema::hasColumn('users', 'telephone_verifie_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('telephone_verifie_at');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('users', 'telephone_verifie_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('telephone_verifie_at')->nullable();
            });
        }

        if (!Schema::hasTable('phone_verification_codes')) {
            Schema::create('phone_verification_codes', function (Blueprint $table) {
                $table->id();
                $table->string('telephone');
                $table->string('purpose');
                $table->string('code_hash');
                $table->timestamp('expires_at');
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();

                $table->index(['telephone', 'purpose']);
            });
        }
    }
};
