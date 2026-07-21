<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BusinessQueryIndexesTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_query_indexes_are_present(): void
    {
        $expected = [
            'users' => ['users_role_status_expiration_index'],
            'adhesion_applications' => ['adhesion_status_expires_index', 'adhesion_status_created_index', 'adhesion_user_id_index'],
            'paiements' => ['paiements_user_created_index', 'paiements_status_created_index', 'paiements_cotisation_id_index'],
            'mobile_money_transactions' => ['mmt_user_created_index', 'mmt_status_created_index'],
            'cotisations' => ['cotisations_user_status_period_index'],
            'notifications' => ['notifications_user_status_date_index', 'notifications_user_date_id_index'],
            'admin_actions' => ['admin_actions_target_date_index', 'admin_actions_admin_id_index', 'admin_actions_date_action_index'],
        ];

        foreach ($expected as $table => $indexes) {
            foreach ($indexes as $index) {
                $this->assertTrue(Schema::hasIndex($table, $index), "Index manquant : {$index}");
            }
        }
    }
}
