<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PinSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_adhesion_rejects_a_common_pin(): void
    {
        $this->postJson('/api/adhesion/start', $this->adhesionPayload('123456'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pin');
    }

    public function test_adhesion_rejects_a_pin_derived_from_birth_date(): void
    {
        $this->postJson('/api/adhesion/start', $this->adhesionPayload('150190'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pin');
    }

    public function test_pin_reset_rejects_a_weak_pin_without_consuming_the_link(): void
    {
        $token = 'reset-token-that-remains-valid';
        $user = User::factory()->member()->active()->create([
            'date_naissance' => '1990-01-15',
            'pin_hash' => Hash::make('482951'),
            'pin_configured_at' => now(),
            'pin_reset_token_hash' => hash('sha256', $token),
            'pin_reset_token_expires_at' => now()->addMinutes(30),
        ]);

        $this->postJson('/api/pin/reset', [
            'token' => $token,
            'pin' => '150190',
            'pin_confirmation' => '150190',
        ])->assertUnprocessable()->assertJsonValidationErrors('pin');

        $this->assertNotNull($user->fresh()->pin_reset_token_hash);
        $this->assertTrue(Hash::check('482951', (string) $user->fresh()->pin_hash));
    }

    /** @return array<string, mixed> */
    private function adhesionPayload(string $pin): array
    {
        return [
            'civilite' => 'Mme',
            'prenom' => 'Awa',
            'nom' => 'Diallo',
            'date_naissance' => '1990-01-15',
            'telephone' => '771234567',
            'email' => 'awa@example.test',
            'pays_residence' => 'Senegal',
            'region' => 'Dakar',
            'departement' => 'Dakar',
            'commune' => 'Medina',
            'numero_cni' => '1987654321012',
            'pin' => $pin,
            'pin_confirmation' => $pin,
            'conditions_acceptees' => true,
        ];
    }
}
