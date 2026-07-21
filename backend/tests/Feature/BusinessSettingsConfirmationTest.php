<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BusinessSettingsConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_settings_update_requires_confirmation_phrase(): void
    {
        $token = $this->adminToken();

        $response = $this
            ->withToken($token)
            ->putJson('/api/admin/business-settings', [
                'settings' => [
                    'cotisation_montant_mensuel' => 10000,
                ],
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('confirmation_phrase');

        $this->assertDatabaseMissing('business_settings', [
            'key' => 'cotisation_montant_mensuel',
            'value' => '10000',
        ]);
    }

    public function test_business_settings_update_accepts_confirmation_phrase(): void
    {
        $token = $this->adminToken();

        $response = $this
            ->withToken($token)
            ->putJson('/api/admin/business-settings', [
                'settings' => [
                    'cotisation_montant_mensuel' => 10000,
                    'payment_warning_unsold_months_threshold' => 2,
                    'auto_block_unsold_months_threshold' => 4,
                ],
                'confirmation_phrase' => 'CONFIRMER',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('settings.cotisation_montant_mensuel', 10000)
            ->assertJsonPath('settings.payment_warning_unsold_months_threshold', 2)
            ->assertJsonPath('settings.auto_block_unsold_months_threshold', 4);

        $this->assertSame('10000', BusinessSetting::where('key', 'cotisation_montant_mensuel')->value('value'));
    }

    private function adminToken(): string
    {
        $admin = User::factory()->admin()->create();
        $token = Str::random(60);
        $admin->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        return $token;
    }
}
