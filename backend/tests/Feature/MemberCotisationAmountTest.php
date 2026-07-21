<?php

namespace Tests\Feature;

use App\Models\Paiement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberCotisationAmountTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_member_can_choose_monthly_amount_before_first_payment(): void
    {
        $user = User::factory()->create([
            'role' => 'membre',
            'statut' => 'actif',
            'cotisation_montant_mensuel' => null,
        ]);

        $this->actingAsApiUser($user)
            ->postJson('/api/cotisations/montant-mensuel', ['montant_mensuel' => 5000])
            ->assertOk()
            ->assertJsonPath('configuration.montant_mensuel', 5000)
            ->assertJsonPath('configuration.choix_requis', false);

        $this->assertSame(5000, (int) $user->fresh()->cotisation_montant_mensuel);
    }

    public function test_member_cannot_choose_an_unsupported_amount(): void
    {
        $user = User::factory()->create(['cotisation_montant_mensuel' => null]);

        $this->actingAsApiUser($user)
            ->postJson('/api/cotisations/montant-mensuel', ['montant_mensuel' => 15000])
            ->assertUnprocessable();
    }

    public function test_choice_is_locked_once_configured(): void
    {
        $user = User::factory()->create(['cotisation_montant_mensuel' => 10000]);

        $this->actingAsApiUser($user)
            ->postJson('/api/cotisations/montant-mensuel', ['montant_mensuel' => 5000])
            ->assertUnprocessable();

        $this->assertSame(10000, (int) $user->fresh()->cotisation_montant_mensuel);
    }

    public function test_payment_is_rejected_until_monthly_amount_is_chosen(): void
    {
        $user = User::factory()->create(['cotisation_montant_mensuel' => null]);

        $this->actingAsApiUser($user)
            ->postJson('/api/paiement', [
                'type' => 'cotisation',
                'montant' => 5000,
                'telephone' => '771234567',
                'methode_paiement' => 'dexpay',
                'canal_paiement' => 'wave',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cotisation_montant_mensuel');
    }

    private function actingAsApiUser(User $user): self
    {
        $token = 'test-token-' . $user->id;
        $user->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }
}
