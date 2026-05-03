<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MobileMoneyService
{
    public function payerAvecWave(int $montant, string $telephone, array $metadata = []): array
    {
        if (config('services.mobile_money.mode') === 'dev' || empty(config('services.mobile_money.wave.api_key'))) {
            return $this->simulerReponse('wave');
        }

        $response = Http::retry(3, 200)
            ->timeout(15)
            ->withToken(config('services.mobile_money.wave.api_key'))
            ->post(rtrim(config('services.mobile_money.wave.base_url'), '/') . '/payments', [
                'amount' => $montant,
                'phone_number' => $telephone,
                'currency' => 'XOF',
                'metadata' => $metadata,
                'callback_url' => config('services.mobile_money.webhook_url'),
            ]);

        if (!$response->successful()) {
            return [
                'status' => 'failed',
                'reference' => null,
                'provider' => 'wave',
                'message' => 'Erreur Wave',
                'provider_payload' => $response->json(),
            ];
        }

        $data = $response->json();

        return [
            'status' => 'success',
            'reference' => $data['reference'] ?? ('WV' . strtoupper(Str::random(10))),
            'provider' => 'wave',
            'message' => $data['message'] ?? 'Paiement initie via Wave',
            'provider_payload' => $data,
        ];
    }

    public function payerAvecOrangeMoney(int $montant, string $telephone, array $metadata = []): array
    {
        if (!config('services.mobile_money.orange_money.enabled', false)) {
            return [
                'status' => 'failed',
                'reference' => null,
                'provider' => 'orange_money',
                'message' => 'Orange Money sera disponible prochainement.',
            ];
        }

        if (config('services.mobile_money.mode') === 'dev' || empty(config('services.mobile_money.orange_money.api_key'))) {
            return $this->simulerReponse('orange_money');
        }

        $response = Http::retry(3, 200)
            ->timeout(15)
            ->withHeaders([
                'X-API-KEY' => config('services.mobile_money.orange_money.api_key'),
            ])->post(rtrim(config('services.mobile_money.orange_money.base_url'), '/') . '/transactions', [
                'amount' => $montant,
                'msisdn' => $telephone,
                'currency' => 'XOF',
                'metadata' => $metadata,
                'callback_url' => config('services.mobile_money.webhook_url'),
            ]);

        if (!$response->successful()) {
            return [
                'status' => 'failed',
                'reference' => null,
                'provider' => 'orange_money',
                'message' => 'Erreur Orange Money',
                'provider_payload' => $response->json(),
            ];
        }

        $data = $response->json();

        return [
            'status' => 'success',
            'reference' => $data['reference'] ?? ('OM' . strtoupper(Str::random(10))),
            'provider' => 'orange_money',
            'message' => $data['message'] ?? 'Paiement initie via Orange Money',
            'provider_payload' => $data,
        ];
    }

    public function verifierPaiement(string $reference): array
    {
        if (config('services.mobile_money.mode') === 'dev') {
            return ['status' => 'success', 'reference' => $reference, 'message' => 'Paiement confirme (simulation)'];
        }

        return ['status' => 'failed', 'reference' => $reference, 'message' => 'Verification distante non configuree'];
    }

    public function traiterWebhook(array $data): array
    {
        return [
            'reference' => $data['reference'] ?? null,
            'status' => $data['status'] ?? 'failed',
        ];
    }

    private function simulerReponse(string $provider): array
    {
        $ok = random_int(1, 100) <= 80;

        return [
            'status' => $ok ? 'success' : 'failed',
            'reference' => 'TXN_' . strtoupper(Str::random(10)),
            'provider' => $provider,
            'message' => $ok ? 'Paiement reussi (simulation)' : 'Paiement echoue (simulation)',
        ];
    }
}
