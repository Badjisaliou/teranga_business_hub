<?php

namespace App\Services;

use App\Models\AdhesionApplication;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DexPayService
{
    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    public function creerSession(User $user, int $montant, string $type, ?string $canalPaiement = null, array $metadata = [], ?string $reference = null): array
    {
        return $this->creerSessionPourClient(
            trim($user->prenom . ' ' . $user->nom),
            $user->email,
            $user->telephone,
            $montant,
            $type,
            $canalPaiement,
            array_merge($metadata, ['user_id' => $user->id]),
            $reference
        );
    }

    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    public function creerSessionAdhesionApplication(AdhesionApplication $application, ?string $canalPaiement = null, array $metadata = [], ?string $reference = null): array
    {
        return $this->creerSessionPourClient(
            trim($application->prenom . ' ' . $application->nom),
            $application->email,
            $application->telephone,
            (int) $application->montant_adhesion,
            'adhesion',
            $canalPaiement,
            array_merge($metadata, [
                'adhesion_application_id' => $application->id,
                'adhesion_public_id' => $application->public_id,
            ]),
            $reference
        );
    }

    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    private function creerSessionPourClient(
        string $customerName,
        ?string $customerEmail,
        ?string $customerPhone,
        int $montant,
        string $type,
        ?string $canalPaiement = null,
        array $metadata = [],
        ?string $reference = null
    ): array {
        if ($this->isDevFallback()) {
            return $this->simulerSession($montant, $type, $reference);
        }

        if (!$this->hasCredentials()) {
            return [
                'status' => 'failed',
                'reference' => null,
                'provider' => 'dexpay',
                'message' => 'Configuration DexPay incomplete. Verifiez DEXPAY_PUBLIC_KEY.',
                'provider_payload' => null,
            ];
        }

        $reference ??= $this->genererReference();
        $payload = array_filter([
            'reference' => $reference,
            'item_name' => $type === 'adhesion' ? 'Adhesion Teranga Business Hub' : 'Cotisation Teranga Business Hub',
            'amount' => $montant,
            'currency' => config('services.dexpay.currency', 'XOF'),
            'countryISO' => config('services.dexpay.country_iso', 'SN'),
            'payment_method' => $canalPaiement,
            'webhook_url' => config('services.dexpay.webhook_url'),
            'success_url' => $this->appendReference((string) config('services.dexpay.success_url'), $reference, $type),
            'failure_url' => $this->appendReference((string) config('services.dexpay.failure_url'), $reference, $type),
            'customer' => array_filter([
                'name' => $customerName,
                'email' => $customerEmail,
                'phone' => $customerPhone,
            ]),
            'metadata' => array_merge($metadata, [
                'type' => $type,
                'canal_paiement' => $canalPaiement,
            ]),
        ], fn ($value) => $value !== null && $value !== '');

        $response = Http::retry(3, 250)
            ->timeout(20)
            ->withHeaders($this->headers())
            ->post(rtrim($this->baseUrl(), '/') . '/checkout-sessions', $payload);

        if (!$response->successful()) {
            Log::warning('dexpay_checkout_session_http_failed', [
                'customer_phone' => $customerPhone,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            return [
                'status' => 'failed',
                'reference' => null,
                'provider' => 'dexpay',
                'message' => 'Erreur DexPay',
                'provider_payload' => $response->json(),
            ];
        }

        $data = $response->json();
        $paymentUrl = $data['payment_url'] ?? $data['checkout_url'] ?? $data['url'] ?? data_get($data, 'data.payment_url');
        if (!is_string($paymentUrl) || $paymentUrl === '') {
            return [
                'status' => 'failed',
                'reference' => null,
                'provider' => 'dexpay',
                'message' => $data['message'] ?? 'Session DexPay creee sans URL de paiement.',
                'provider_payload' => $data,
            ];
        }

        return [
            'status' => 'success',
            'reference' => (string) ($data['reference'] ?? data_get($data, 'data.reference') ?? $reference),
            'provider' => 'dexpay',
            'message' => $data['message'] ?? 'Checkout DexPay cree',
            'checkout_url' => $paymentUrl,
            'expires_at' => $data['expires_at'] ?? data_get($data, 'data.expires_at'),
            'provider_payload' => $data,
        ];
    }

    public function normaliserStatut(string $status, ?string $event = null): string
    {
        $normalized = strtolower(trim($status));
        $normalizedEvent = strtolower(trim((string) $event));

        if (in_array($normalized, ['success', 'successful', 'completed', 'paid'], true)
            || $normalizedEvent === 'checkout.completed') {
            return 'success';
        }

        if (in_array($normalized, ['failed', 'failure', 'cancelled', 'canceled', 'declined', 'expired'], true)
            || in_array($normalizedEvent, ['checkout.failed', 'checkout.cancelled', 'checkout.canceled', 'checkout.expired'], true)) {
            return 'failed';
        }

        return 'pending';
    }

    public function verifierSignature(string $rawPayload, ?string $signature): bool
    {
        if ($signature === null || $signature === '') {
            return false;
        }

        $signature = preg_replace('/^sha256=/i', '', trim($signature)) ?? '';
        $secrets = array_values(array_unique(array_filter([
            trim((string) config('services.dexpay.webhook_secret', '')),
            trim((string) config('services.dexpay.secret_key', '')),
        ])));

        foreach ($secrets as $secret) {
            $hexSignature = hash_hmac('sha256', $rawPayload, $secret);
            $base64Signature = base64_encode(hash_hmac('sha256', $rawPayload, $secret, true));

            if (hash_equals($hexSignature, $signature) || hash_equals($base64Signature, $signature)) {
                return true;
            }
        }

        return false;
    }

    public function checkoutUrl(string $reference): ?string
    {
        if (!$this->isDevFallback()) {
            return null;
        }

        return $this->appendReference((string) config('services.dexpay.success_url'), $reference);
    }

    public function baseUrl(): string
    {
        return config('services.dexpay.mode') === 'live'
            ? 'https://api.dexpay.africa/api/v1'
            : 'https://api-sandbox.dexpay.africa/api/v1';
    }

    /**
     * @return array<string, string>
     */
    public function headers(): array
    {
        return [
            'x-api-key' => (string) config('services.dexpay.public_key'),
            'Content-Type' => 'application/json',
        ];
    }

    public function isDevFallback(): bool
    {
        return !(bool) config('services.dexpay.enabled', false);
    }

    public function hasCredentials(): bool
    {
        return (string) config('services.dexpay.public_key', '') !== '';
    }

    /**
     * @return array<string, mixed>
     */
    public function simulerSession(int $montant, string $type, ?string $reference = null): array
    {
        $reference ??= $this->genererReference();

        return [
            'status' => 'success',
            'reference' => $reference,
            'provider' => 'dexpay',
            'message' => 'Checkout DexPay cree (simulation)',
            'checkout_url' => $this->checkoutUrl($reference),
            'provider_payload' => [
                'reference' => $reference,
                'amount' => $montant,
                'type' => $type,
                'status' => 'success',
            ],
        ];
    }

    public function genererReference(): string
    {
        return 'DEXPAY_' . strtoupper(bin2hex(random_bytes(8)));
    }

    private function appendReference(string $url, string $reference, ?string $type = null): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        $result = $url . $separator . 'reference=' . urlencode($reference) . '&token=' . urlencode($reference);

        return $type !== null ? $result . '&type=' . urlencode($type) : $result;
    }
}
