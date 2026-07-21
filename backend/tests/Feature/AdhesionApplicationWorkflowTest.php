<?php

namespace Tests\Feature;

use App\Models\AdhesionApplication;
use App\Models\Paiement;
use App\Models\User;
use App\Services\AdhesionApplicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class AdhesionApplicationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_must_be_at_least_eighteen_to_start_adhesion(): void
    {
        $payload = $this->validPayload();
        $payload['date_naissance'] = now()->subYears(17)->toDateString();

        $this->postJson('/api/adhesion/start', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_naissance');
    }

    public function test_member_is_created_only_after_successful_adhesion_payment(): void
    {
        $startResponse = $this->postJson('/api/adhesion/start', $this->validPayload());

        $startResponse
            ->assertCreated()
            ->assertJsonPath('application.statut', 'draft');

        $publicId = $startResponse->json('application.public_id');
        $this->assertSame(0, User::where('role', 'membre')->count());

        $paymentResponse = $this->postJson("/api/adhesion/{$publicId}/payment", [
            'canal_paiement' => 'wave',
        ]);

        $paymentResponse
            ->assertCreated()
            ->assertJsonPath('application.statut', 'payment_pending');

        $reference = $paymentResponse->json('application.payment_reference');
        $this->assertIsString($reference);
        $this->assertSame(0, User::where('role', 'membre')->count());

        $user = app(AdhesionApplicationService::class)->handlePaymentResult($reference, 'success');

        $this->assertNotNull($user);
        $this->assertSame('actif', $user->statut);
        $this->assertNotEmpty($user->matricule);
        $this->assertNotEmpty($user->card_token);
        $this->assertNull($user->password);
        $this->assertNotNull($user->pin_configured_at);
        $this->assertTrue(Hash::check('482951', (string) $user->pin_hash));
        $this->assertSame('Aminata', $user->prenom);
        $this->assertSame('Diop', $user->nom);
        $this->assertSame('771234567', $user->telephone);

        $this->assertDatabaseHas('adhesion_applications', [
            'public_id' => $publicId,
            'statut' => 'paid',
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('paiements', [
            'user_id' => $user->id,
            'type' => 'adhesion',
            'reference' => $reference,
            'montant' => 10000,
            'statut' => 'succes',
        ]);

        $this->assertSame(12, $user->cotisations()->count());

        $statusResponse = $this->getJson('/api/adhesion/payment/status?reference=' . urlencode($reference));

        $statusResponse
            ->assertOk()
            ->assertJsonPath('application.statut', 'paid')
            ->assertJsonPath('member.matricule', $user->matricule);
    }

    public function test_adhesion_reference_is_reserved_before_dexpay_and_checkout_is_replayable(): void
    {
        config()->set('services.dexpay.enabled', true);
        config()->set('services.dexpay.mode', 'sandbox');
        config()->set('services.dexpay.public_key', 'pk_test_123');
        config()->set('services.dexpay.success_url', 'https://frontend.test/paiement/retour');
        config()->set('services.dexpay.failure_url', 'https://frontend.test/paiement/annule');

        Http::fake(function ($request) {
            $this->assertDatabaseHas('adhesion_applications', [
                'payment_reference' => $request['reference'],
                'statut' => 'payment_pending',
            ]);

            return Http::response([
                'reference' => $request['reference'],
                'payment_url' => 'https://checkout.dexpay.test/' . $request['reference'],
                'expires_at' => now()->addHour()->toIso8601String(),
            ], 201);
        });

        $start = $this->postJson('/api/adhesion/start', $this->validPayload())->assertCreated();
        $publicId = (string) $start->json('application.public_id');
        $first = $this->postJson("/api/adhesion/{$publicId}/payment", [
            'canal_paiement' => 'wave',
            'idempotency_key' => 'adhesion-recovery-test',
        ])->assertCreated();
        $second = $this->postJson("/api/adhesion/{$publicId}/payment", [
            'canal_paiement' => 'wave',
            'idempotency_key' => 'adhesion-recovery-test',
        ])->assertOk();

        $reference = (string) $first->json('application.payment_reference');
        $first->assertJsonPath('checkout_url', 'https://checkout.dexpay.test/' . $reference);
        $second
            ->assertJsonPath('application.payment_reference', $reference)
            ->assertJsonPath('checkout_url', 'https://checkout.dexpay.test/' . $reference);
        $this->assertDatabaseHas('adhesion_applications', [
            'public_id' => $publicId,
            'payment_reference' => $reference,
            'checkout_url' => 'https://checkout.dexpay.test/' . $reference,
        ]);
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request['success_url'] === "https://frontend.test/paiement/retour?reference={$reference}&token={$reference}&type=adhesion");
    }

    public function test_failed_adhesion_payment_does_not_create_member(): void
    {
        $application = AdhesionApplication::create([
            ...$this->validPayload(),
            'public_id' => '00000000-0000-0000-0000-000000000001',
            'telephone' => '771234567',
            'email' => null,
            'conditions_acceptees' => true,
            'statut' => 'payment_pending',
            'montant_adhesion' => 10000,
            'payment_reference' => 'DEXPAY_FAILED_TEST',
            'payment_method' => 'dexpay',
            'payment_channel' => 'wave',
            'expires_at' => now()->addDay(),
        ]);

        $user = app(AdhesionApplicationService::class)->handlePaymentResult(
            (string) $application->payment_reference,
            'failed',
            'Paiement annule'
        );

        $this->assertNull($user);
        $this->assertSame(0, User::where('role', 'membre')->count());
        $this->assertDatabaseHas('adhesion_applications', [
            'id' => $application->id,
            'statut' => 'failed',
            'failure_reason' => 'Paiement annule',
        ]);
        $this->assertSame(0, Paiement::count());
    }

    public function test_pending_adhesion_event_does_not_fail_application_or_create_member(): void
    {
        $application = AdhesionApplication::create([
            ...$this->validPayload(),
            'public_id' => '00000000-0000-0000-0000-000000000005',
            'telephone' => '771234567',
            'email' => null,
            'conditions_acceptees' => true,
            'statut' => 'payment_pending',
            'montant_adhesion' => 10000,
            'payment_reference' => 'DEXPAY_PENDING_ADHESION',
            'payment_method' => 'dexpay',
            'payment_channel' => 'wave',
            'expires_at' => now()->addDay(),
        ]);

        $user = app(AdhesionApplicationService::class)->handlePaymentResult(
            (string) $application->payment_reference,
            'pending'
        );

        $this->assertNull($user);
        $this->assertSame(0, User::where('role', 'membre')->count());
        $this->assertDatabaseHas('adhesion_applications', [
            'id' => $application->id,
            'statut' => 'payment_pending',
            'failure_reason' => null,
        ]);
    }

    public function test_stale_adhesion_application_can_expire_and_be_restarted(): void
    {
        AdhesionApplication::create([
            ...$this->validPayload(),
            'public_id' => '00000000-0000-0000-0000-000000000002',
            'telephone' => '771234567',
            'email' => null,
            'conditions_acceptees' => true,
            'statut' => 'draft',
            'montant_adhesion' => 10000,
            'expires_at' => now()->subMinute(),
        ]);

        $expired = app(AdhesionApplicationService::class)->expireStaleApplications();

        $this->assertSame(1, $expired);
        $this->assertDatabaseHas('adhesion_applications', [
            'telephone' => '771234567',
            'numero_cni' => '1234567890',
            'statut' => 'expired',
        ]);

        $this
            ->postJson('/api/adhesion/start', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('application.statut', 'draft');
    }

    public function test_expired_adhesion_checkout_is_closed_but_reference_is_preserved(): void
    {
        $application = AdhesionApplication::create([
            ...$this->validPayload(),
            'public_id' => '00000000-0000-0000-0000-000000000006',
            'telephone' => '771234567',
            'email' => null,
            'conditions_acceptees' => true,
            'statut' => 'payment_pending',
            'montant_adhesion' => 10000,
            'payment_reference' => 'DEXPAY_EXPIRED_CHECKOUT',
            'payment_method' => 'dexpay',
            'payment_channel' => 'wave',
            'checkout_url' => 'https://checkout.dexpay.test/expired',
            'payment_expires_at' => now()->subMinute(),
            'expires_at' => now()->addDay(),
        ]);

        $this->assertSame(1, app(AdhesionApplicationService::class)->expireStaleApplications());
        $this->assertDatabaseHas('adhesion_applications', [
            'id' => $application->id,
            'statut' => 'expired',
            'payment_reference' => 'DEXPAY_EXPIRED_CHECKOUT',
            'checkout_url' => null,
        ]);
    }

    public function test_pending_adhesion_application_is_preserved_and_resumed_when_member_restarts(): void
    {
        $oldApplication = AdhesionApplication::create([
            ...$this->validPayload(),
            'public_id' => '00000000-0000-0000-0000-000000000003',
            'telephone' => '771234567',
            'email' => null,
            'conditions_acceptees' => true,
            'statut' => 'payment_pending',
            'montant_adhesion' => 10000,
            'payment_reference' => 'DEXPAY_ABANDONED_TEST',
            'payment_method' => 'dexpay',
            'payment_channel' => 'wave',
            'expires_at' => now()->addDay(),
        ]);

        $response = $this
            ->postJson('/api/adhesion/start', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('application.statut', 'payment_pending')
            ->assertJsonPath('application.public_id', $oldApplication->public_id)
            ->assertJsonPath('application.payment_reference', 'DEXPAY_ABANDONED_TEST');

        $this->assertDatabaseHas('adhesion_applications', [
            'id' => $oldApplication->id,
            'statut' => 'payment_pending',
            'payment_reference' => 'DEXPAY_ABANDONED_TEST',
        ]);
        $this->assertSame(1, AdhesionApplication::count());
        $this->assertSame(0, User::where('role', 'membre')->count());
    }

    public function test_expired_application_with_payment_reference_is_never_deleted_on_restart(): void
    {
        $oldApplication = AdhesionApplication::create([
            ...$this->validPayload(),
            'public_id' => '00000000-0000-0000-0000-000000000004',
            'telephone' => '771234567',
            'email' => null,
            'conditions_acceptees' => true,
            'statut' => 'expired',
            'montant_adhesion' => 10000,
            'payment_reference' => 'DEXPAY_EXPIRED_BUT_TRACKED',
            'payment_method' => 'dexpay',
            'payment_channel' => 'wave',
            'expires_at' => now()->subDay(),
        ]);

        $this->postJson('/api/adhesion/start', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('application.statut', 'draft');

        $this->assertDatabaseHas('adhesion_applications', [
            'id' => $oldApplication->id,
            'payment_reference' => 'DEXPAY_EXPIRED_BUT_TRACKED',
        ]);
        $this->assertSame(2, AdhesionApplication::count());
    }

    public function test_legacy_member_register_endpoint_is_closed(): void
    {
        $response = $this->postJson('/api/register', [
            'nom' => 'Diallo',
            'prenom' => 'Awa',
            'email' => null,
            'telephone' => '771234567',
            'numero_cni' => '1234567890',
            'password' => 'password123',
        ]);

        $response
            ->assertStatus(410)
            ->assertJsonPath('error_code', 'member_registration_moved_to_adhesion');

        $this->assertSame(0, User::where('role', 'membre')->count());
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'civilite' => 'M',
            'prenom' => 'Aminata',
            'nom' => 'Diop',
            'date_naissance' => '1990-01-15',
            'telephone' => '77 123 45 67',
            'email' => null,
            'pays_residence' => 'Senegal',
            'region' => 'Dakar',
            'departement' => 'Dakar',
            'commune' => 'Medina',
            'numero_cni' => '1234567890',
            'conditions_acceptees' => true,
            'pin' => '482951',
            'pin_confirmation' => '482951',
        ];
    }
}
