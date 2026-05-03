<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('cible_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('action', ['validation', 'rejet', 'blocage', 'deblocage']);
            $table->text('description')->nullable();
            $table->dateTime('date_action');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_actions');
    }
};

