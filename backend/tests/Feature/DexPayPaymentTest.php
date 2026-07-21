<?php

namespace Tests\Feature;

use App\Models\MobileMoneyTransaction;
use App\Models\User;
use App\Services\PaiementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class DexPayPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_dexpay_payment_initialization_can_auto_confirm_in_dev(): void
    {
        config()->set('services.dexpay.enabled', false);
        config()->set('services.dexpay.auto_confirm_dev', true);

        $member = $this->memberWithToken();

        $response = $this
            ->withToken($member['token'])
            ->postJson('/api/paiement', [
                'type' => 'cotisation',
                'montant' => 10000,
                'telephone' => '771234567',
                'methode_paiement' => 'dexpay',
                'canal_paiement' => 'wave',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('paiement.type', 'cotisation')
            ->assertJsonPath('paiement.statut', 'succes')
            ->assertJsonPath('paiement.methode_paiement', 'dexpay')
            ->assertJsonPath('paiement.canal_paiement', 'wave')
            ->assertJsonStructure(['checkout_url']);

        $this->assertSame('actif', $member['user']->fresh()->statut);
        $this->assertSame(0, MobileMoneyTransaction::where('user_id', $member['user']->id)->where('methode_paiement', 'dexpay')->count());
        $this->assertDatabaseHas('paiements', [
            'user_id' => $member['user']->id,
            'type' => 'cotisation',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'succes',
        ]);
    }

    public function test_dexpay_completed_webhook_records_cotisation_payment(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');

        $member = User::factory()->member()->active()->create();

        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'DEXPAY_TEST_REFERENCE',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'orange_money',
            'statut' => 'en_attente',
        ]);

        $response = $this->postSignedDexPayWebhook([
            'event' => 'checkout.completed',
            'data' => [
                'reference' => 'DEXPAY_TEST_REFERENCE',
                'amount' => 10000,
                'status' => 'success',
            ],
        ]);

        $response->assertOk()->assertJsonPath('message', 'Webhook DexPay traite');

        $this->assertSame('actif', $member->fresh()->statut);
        $this->assertDatabaseHas('paiements', [
            'reference' => 'DEXPAY_TEST_REFERENCE',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'orange_money',
            'statut' => 'succes',
        ]);
        $this->assertDatabaseMissing('mobile_money_transactions', [
            'reference' => 'DEXPAY_TEST_REFERENCE',
        ]);
    }

    public function test_dexpay_initiated_webhook_keeps_payment_pending(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');

        $member = User::factory()->member()->active()->create();
        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'DEXPAY_PENDING_REFERENCE',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);

        $this->postSignedDexPayWebhook([
            'event' => 'checkout.initiated',
            'reference' => 'DEXPAY_PENDING_REFERENCE',
            'status' => 'initiated',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'pending');

        $this->assertDatabaseHas('mobile_money_transactions', [
            'reference' => 'DEXPAY_PENDING_REFERENCE',
            'statut' => 'en_attente',
        ]);
        $this->assertDatabaseMissing('paiements', [
            'reference' => 'DEXPAY_PENDING_REFERENCE',
        ]);
    }

    public function test_production_shaped_webhook_uses_root_fields_and_secret_key(): void
    {
        config()->set('services.dexpay.webhook_secret', 'wrong-dedicated-secret');
        config()->set('services.dexpay.secret_key', 'test-production-secret-key');

        $member = User::factory()->member()->active()->create();
        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'DEXPAY_PRODUCTION_PAYLOAD',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);

        $payload = [
            'event' => 'checkout.completed',
            'reference' => 'DEXPAY_PRODUCTION_PAYLOAD',
            'transaction_id' => 'transaction-production-test',
            'status' => 'completed',
            'amount' => 10000,
            'currency' => 'XOF',
            'operator' => 'wave_sn',
        ];
        $rawPayload = json_encode($payload);
        $signature = hash_hmac('sha256', $rawPayload, 'test-production-secret-key');

        $this->call('POST', '/api/webhook/dexpay', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_DEXPAY_SIGNATURE' => $signature,
        ], $rawPayload)
            ->assertOk()
            ->assertJsonPath('message', 'Webhook DexPay traite');

        $this->assertDatabaseHas('paiements', [
            'reference' => 'DEXPAY_PRODUCTION_PAYLOAD',
            'statut' => 'succes',
        ]);
    }

    public function test_unknown_dexpay_reference_returns_conflict(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');

        $this->postSignedDexPayWebhook([
            'event' => 'checkout.completed',
            'reference' => 'DEXPAY_ORPHANED_REFERENCE',
            'status' => 'completed',
            'transaction_id' => 'orphaned-transaction',
        ])
            ->assertConflict()
            ->assertJsonPath('message', 'Reference DexPay inconnue. Webhook non rapproche.');
    }

    public function test_dexpay_enabled_initialization_creates_remote_checkout_session(): void
    {
        config()->set('services.dexpay.enabled', true);
        config()->set('services.dexpay.mode', 'sandbox');
        config()->set('services.dexpay.public_key', 'pk_test_123');
        config()->set('services.dexpay.success_url', 'https://frontend.test/paiement/retour');
        config()->set('services.dexpay.failure_url', 'https://frontend.test/paiement/annule');
        config()->set('services.dexpay.webhook_url', 'https://backend.test/api/webhook/dexpay');
        config()->set('services.mobile_money.mode', 'dev');
        config()->set('services.dexpay.auto_confirm_dev', false);

        Http::fake(function ($request) {
            $this->assertDatabaseHas('mobile_money_transactions', [
                'reference' => $request['reference'],
                'statut' => 'en_attente',
            ]);

            return Http::response([
                'reference' => $request['reference'],
                'payment_url' => 'https://checkout.dexpay.test/session/' . $request['reference'],
                'expires_at' => now()->addHour()->toIso8601String(),
                'message' => 'Session creee',
            ], 200);
        });

        $member = $this->memberWithToken([
            'email' => 'member@example.com',
            'telephone' => '771234567',
        ]);

        $response = $this
            ->withToken($member['token'])
            ->postJson('/api/paiement', [
                'type' => 'cotisation',
                'montant' => 10000,
                'telephone' => '709999999',
                'methode_paiement' => 'dexpay',
                'canal_paiement' => 'wave',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('paiement.statut', 'en_attente')
            ->assertJsonPath('paiement.canal_paiement', 'wave');

        $reference = (string) $response->json('paiement.reference');
        $response->assertJsonPath('checkout_url', 'https://checkout.dexpay.test/session/' . $reference);

        $this->assertSame('actif', $member['user']->fresh()->statut);
        $this->assertDatabaseHas('mobile_money_transactions', [
            'reference' => $reference,
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
            'checkout_url' => 'https://checkout.dexpay.test/session/' . $reference,
        ]);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/checkout-sessions')
            && $request->hasHeader('x-api-key', 'pk_test_123')
            && $request['amount'] === 10000
            && $request['currency'] === 'XOF'
            && $request['countryISO'] === 'SN'
            && $request['payment_method'] === 'wave'
            && $request['customer']['phone'] === '771234567'
            && $request['webhook_url'] === 'https://backend.test/api/webhook/dexpay'
            && $request['failure_url'] === 'https://frontend.test/paiement/annule?reference=DEXPAY_'
                . substr((string) $request['reference'], strlen('DEXPAY_'))
                . '&token=' . $request['reference']
                . '&type=cotisation');
    }

    public function test_idempotency_replay_returns_stored_checkout_url(): void
    {
        config()->set('services.dexpay.enabled', true);
        config()->set('services.dexpay.public_key', 'pk_test_123');
        config()->set('services.dexpay.mode', 'sandbox');

        Http::fake(fn ($request) => Http::response([
            'reference' => $request['reference'],
            'payment_url' => 'https://checkout.dexpay.test/session/' . $request['reference'],
            'expires_at' => now()->addHour()->toIso8601String(),
        ], 201));

        $member = $this->memberWithToken(['telephone' => '771234567']);
        $payload = [
            'type' => 'cotisation',
            'montant' => 10000,
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
        ];

        $first = $this->withToken($member['token'])->withHeader('Idempotency-Key', 'idem-recovery')->postJson('/api/paiement', $payload);
        $second = $this->withToken($member['token'])->withHeader('Idempotency-Key', 'idem-recovery')->postJson('/api/paiement', $payload);

        $first->assertCreated();
        $second->assertOk()
            ->assertJsonPath('paiement.reference', $first->json('paiement.reference'))
            ->assertJsonPath('checkout_url', $first->json('checkout_url'));
        Http::assertSentCount(1);
    }

    public function test_stale_pending_transaction_is_expired_without_deletion(): void
    {
        config()->set('services.dexpay.pending_expiration_hours', 24);
        $member = User::factory()->member()->active()->create();
        $transaction = MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'DEXPAY_STALE_PENDING',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
            'checkout_url' => 'https://checkout.dexpay.test/stale',
            'expires_at' => now()->subMinute(),
        ]);

        $this->assertSame(1, app(PaiementService::class)->expireStaleTransactions());
        $this->assertDatabaseHas('mobile_money_transactions', [
            'id' => $transaction->id,
            'statut' => 'echoue',
            'checkout_url' => null,
            'failure_reason' => 'Session de paiement expiree sans confirmation DexPay.',
        ]);
    }

    public function test_completed_webhook_replay_is_idempotent(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');
        $member = User::factory()->member()->active()->create();
        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'DEXPAY_REPLAY_COMPLETED',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);
        $payload = [
            'event' => 'checkout.completed',
            'reference' => 'DEXPAY_REPLAY_COMPLETED',
            'status' => 'completed',
        ];

        $this->postSignedDexPayWebhook($payload)->assertOk();
        $this->postSignedDexPayWebhook($payload)->assertOk();

        $this->assertSame(1, \App\Models\Paiement::where('reference', 'DEXPAY_REPLAY_COMPLETED')->count());
    }

    public function test_dexpay_webhook_rejects_invalid_signature(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');

        MobileMoneyTransaction::create([
            'user_id' => User::factory()->member()->active()->create()->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'DEXPAY_INVALID_SIGNATURE',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);

        $this->postJson('/api/webhook/dexpay', [
            'event' => 'checkout.completed',
            'data' => ['reference' => 'DEXPAY_INVALID_SIGNATURE', 'status' => 'success'],
        ], ['X-Dexchange-Signature' => 'bad-signature'])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Signature DexPay invalide.');

        $this->assertDatabaseHas('mobile_money_transactions', [
            'reference' => 'DEXPAY_INVALID_SIGNATURE',
            'statut' => 'en_attente',
        ]);
    }

    public function test_dexpay_webhook_rejects_invalid_payload(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');

        $payload = '"invalid-payload"';
        $signature = hash_hmac('sha256', $payload, 'test-webhook-secret');

        $this->call('POST', '/api/webhook/dexpay', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_DEXCHANGE_SIGNATURE' => $signature,
        ], $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('data');
    }

    public function test_dexpay_webhook_requires_reference(): void
    {
        config()->set('services.dexpay.webhook_secret', 'test-webhook-secret');

        $this->postSignedDexPayWebhook([
            'event' => 'checkout.completed',
            'data' => ['status' => 'success'],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reference');
    }

    public function test_member_can_check_pending_dexpay_payment_status(): void
    {
        $member = $this->memberWithToken();

        MobileMoneyTransaction::create([
            'user_id' => $member['user']->id,
            'type' => 'cotisation',
            'montant' => 20000,
            'reference' => 'DEXPAY_PENDING_REFERENCE',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);

        $response = $this
            ->withToken($member['token'])
            ->getJson('/api/paiement/status?reference=DEXPAY_PENDING_REFERENCE');

        $response
            ->assertOk()
            ->assertJsonPath('status', 'en_attente')
            ->assertJsonPath('source', 'transaction')
            ->assertJsonPath('paiement.reference', 'DEXPAY_PENDING_REFERENCE')
            ->assertJsonPath('paiement.methode_paiement', 'dexpay')
            ->assertJsonPath('paiement.canal_paiement', 'wave');
    }

    public function test_invalid_payment_channel_is_rejected(): void
    {
        $member = $this->memberWithToken();

        $this
            ->withToken($member['token'])
            ->postJson('/api/paiement', [
                'type' => 'cotisation',
                'montant' => 10000,
                'telephone' => '771234567',
                'methode_paiement' => 'dexpay',
                'canal_paiement' => 'unknown',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('canal_paiement');
    }

    public function test_payment_channel_is_copied_from_transaction_to_payment(): void
    {
        $member = User::factory()->member()->active()->create();

        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 20000,
            'reference' => 'DEXPAY_CHANNEL_COPY',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'orange_money',
            'statut' => 'en_attente',
        ]);

        app(PaiementService::class)->traiterPaiement('DEXPAY_CHANNEL_COPY', 'success');

        $this->assertDatabaseHas('paiements', [
            'reference' => 'DEXPAY_CHANNEL_COPY',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'orange_money',
            'statut' => 'succes',
        ]);
    }

    /**
     * @param array<string, mixed> $state
     * @return array{user: User, token: string}
     */
    private function memberWithToken(array $state = []): array
    {
        $member = User::factory()->member()->active()->create($state);
        $token = Str::random(60);
        $member->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        return ['user' => $member, 'token' => $token];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function postSignedDexPayWebhook(array $payload)
    {
        $rawPayload = json_encode($payload);
        $signature = hash_hmac('sha256', $rawPayload, 'test-webhook-secret');

        return $this->call('POST', '/api/webhook/dexpay', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_DEXCHANGE_SIGNATURE' => $signature,
        ], $rawPayload);
    }
}
