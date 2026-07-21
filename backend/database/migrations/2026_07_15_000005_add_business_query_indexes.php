<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'statut', 'date_expiration'], 'users_role_status_expiration_index');
        });

        Schema::table('adhesion_applications', function (Blueprint $table) {
            $table->index(['statut', 'expires_at'], 'adhesion_status_expires_index');
            $table->index(['statut', 'created_at'], 'adhesion_status_created_index');
            $table->index('user_id', 'adhesion_user_id_index');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'paiements_user_created_index');
            $table->index(['statut', 'created_at'], 'paiements_status_created_index');
            $table->index('cotisation_id', 'paiements_cotisation_id_index');
        });

        Schema::table('mobile_money_transactions', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'mmt_user_created_index');
            $table->index(['statut', 'created_at'], 'mmt_status_created_index');
        });

        Schema::table('cotisations', function (Blueprint $table) {
            $table->index(['user_id', 'statut', 'annee', 'mois'], 'cotisations_user_status_period_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'statut', 'date_envoi'], 'notifications_user_status_date_index');
            $table->index(['user_id', 'date_envoi', 'id'], 'notifications_user_date_id_index');
        });

        Schema::table('admin_actions', function (Blueprint $table) {
            $table->index(['cible_user_id', 'date_action'], 'admin_actions_target_date_index');
            $table->index('admin_id', 'admin_actions_admin_id_index');
            $table->index('date_action', 'admin_actions_date_action_index');
        });
    }

    public function down(): void
    {
        Schema::table('admin_actions', function (Blueprint $table) {
            $table->dropIndex('admin_actions_target_date_index');
            $table->dropIndex('admin_actions_admin_id_index');
            $table->dropIndex('admin_actions_date_action_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_status_date_index');
            $table->dropIndex('notifications_user_date_id_index');
        });

        Schema::table('cotisations', function (Blueprint $table) {
            $table->dropIndex('cotisations_user_status_period_index');
        });

        Schema::table('mobile_money_transactions', function (Blueprint $table) {
            $table->dropIndex('mmt_user_created_index');
            $table->dropIndex('mmt_status_created_index');
        });

        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndex('paiements_user_created_index');
            $table->dropIndex('paiements_status_created_index');
            $table->dropIndex('paiements_cotisation_id_index');
        });

        Schema::table('adhesion_applications', function (Blueprint $table) {
            $table->dropIndex('adhesion_status_expires_index');
            $table->dropIndex('adhesion_status_created_index');
            $table->dropIndex('adhesion_user_id_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_status_expiration_index');
        });
    }
};
