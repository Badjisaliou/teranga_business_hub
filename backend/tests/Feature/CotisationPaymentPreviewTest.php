<?php

namespace Tests\Feature;

use App\Models\Cotisation;
use App\Models\MobileMoneyTransaction;
use App\Models\Paiement;
use App\Models\User;
use App\Services\PaiementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CotisationPaymentPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_preview_cotisation_payment_distribution(): void
    {
        $member = User::factory()->member()->active()->create();
        $token = Str::random(60);
        $member->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        Cotisation::create([
            'user_id' => $member->id,
            'mois' => 3,
            'annee' => 2026,
            'montant_paye' => 10000,
            'statut' => 'partiel',
        ]);
        Cotisation::create([
            'user_id' => $member->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ]);

        $response = $this
            ->withToken($token)
            ->getJson('/api/paiements/cotisation-preview?montant=25000');

        $response
            ->assertOk()
            ->assertJsonPath('montant', 25000)
            ->assertJsonPath('montant_mensuel', 20000)
            ->assertJsonPath('total_a_solder', 30000)
            ->assertJsonPath('reste_non_affecte', 0)
            ->assertJsonPath('repartition.0.mois', 3)
            ->assertJsonPath('repartition.0.montant_affecte', 10000)
            ->assertJsonPath('repartition.0.statut_apres_paiement', 'a_jour')
            ->assertJsonPath('repartition.1.mois', 4)
            ->assertJsonPath('repartition.1.montant_affecte', 15000)
            ->assertJsonPath('repartition.1.statut_apres_paiement', 'partiel');
    }

    public function test_successful_cotisation_payment_is_distributed_to_oldest_unsold_months(): void
    {
        $member = User::factory()->member()->active()->create();
        $march = Cotisation::create([
            'user_id' => $member->id,
            'mois' => 3,
            'annee' => 2026,
            'montant_paye' => 10000,
            'statut' => 'partiel',
        ]);
        $april = Cotisation::create([
            'user_id' => $member->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'en_retard',
        ]);

        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 25000,
            'reference' => 'COTISATION-DISTRIBUTION-001',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);

        $paiement = app(PaiementService::class)->traiterPaiement('COTISATION-DISTRIBUTION-001', 'success');

        $this->assertNotNull($paiement);
        $this->assertSame('succes', $paiement->statut);
        $this->assertSame('a_jour', $march->fresh()->statut);
        $this->assertSame(20000, (int) $march->fresh()->montant_paye);
        $this->assertSame('partiel', $april->fresh()->statut);
        $this->assertSame(15000, (int) $april->fresh()->montant_paye);
        $this->assertDatabaseHas('paiements', [
            'reference' => 'COTISATION-DISTRIBUTION-001',
            'type' => 'cotisation',
            'montant' => 25000,
            'statut' => 'succes',
        ]);
        $this->assertSame(2, Paiement::where('reference', 'like', 'COTISATION-DISTRIBUTION-001-COT-%')->count());
        $this->assertDatabaseMissing('mobile_money_transactions', [
            'reference' => 'COTISATION-DISTRIBUTION-001',
        ]);
    }

    public function test_blocked_member_cannot_start_cotisation_payment(): void
    {
        $member = User::factory()->member()->active()->state(['statut' => 'bloque'])->create();

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        app(PaiementService::class)->initierPaiement(
            $member,
            'dexpay',
            '771234567',
            'cotisation',
            20000,
            null,
            null,
            'wave',
        );
    }
}
