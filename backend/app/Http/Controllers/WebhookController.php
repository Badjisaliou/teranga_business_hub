<?php

namespace App\Http\Controllers;

use App\Services\MobileMoneyService;
use App\Services\PaiementService;
use App\Services\DexPayService;
use App\Services\AdhesionApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class WebhookController extends Controller
{
    public function __construct(
        private readonly PaiementService $paiementService,
        private readonly MobileMoneyService $mobileMoneyService,
        private readonly DexPayService $dexPayService,
        private readonly AdhesionApplicationService $adhesionApplicationService,
    ) {
    }

    public function mobileMoney(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:100'],
            'status' => ['required', 'in:success,failed,echoue'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $normalized = $this->mobileMoneyService->traiterWebhook($validated);
        $status = $normalized['status'] === 'success' ? 'success' : 'failed';
        $paiement = $this->paiementService->traiterPaiement(
            (string) $normalized['reference'],
            $status,
            isset($validated['reason']) ? (string) $validated['reason'] : null
        );

        if (!$paiement) {
            return response()->json([
                'message' => 'Webhook traite (transaction echouee, aucun paiement enregistre).',
            ]);
        }

        return response()->json(['message' => 'Webhook traite', 'paiement' => $paiement]);
    }

    public function dexPay(Request $request): JsonResponse
    {
        $rawPayload = $request->getContent();
        $signatureHeader = (string) config('services.dexpay.signature_header', 'X-Dexchange-Signature');
        $signature = $this->dexPaySignature($request, $signatureHeader);

        if (!$this->dexPayService->verifierSignature($rawPayload, $signature)) {
            return response()->json([
                'message' => 'Signature DexPay invalide.',
            ], 401);
        }

        $payload = json_decode($rawPayload, true);
        if (!is_array($payload)) {
            throw ValidationException::withMessages([
                'data' => ['Payload DexPay invalide.'],
            ]);
        }

        $reference = data_get($payload, 'reference') ?? data_get($payload, 'data.reference');
        if (!is_string($reference) || $reference === '') {
            throw ValidationException::withMessages([
                'reference' => ['Reference DexPay manquante.'],
            ]);
        }

        $event = is_string($payload['event'] ?? null) ? $payload['event'] : null;
        $providerStatus = data_get($payload, 'status') ?? data_get($payload, 'data.status') ?? '';
        $status = $this->dexPayService->normaliserStatut((string) $providerStatus, $event);
        $reason = data_get($payload, 'message') ?? data_get($payload, 'data.message');

        if ($status === 'pending') {
            Log::info('dexpay_webhook_pending', [
                'reference' => $reference,
                'event' => $event,
                'provider_status' => $providerStatus,
            ]);

            return response()->json([
                'message' => 'Webhook DexPay recu (paiement en attente).',
                'status' => 'pending',
            ]);
        }

        if ($this->adhesionApplicationService->hasPaymentReference($reference)) {
            try {
                $adhesionUser = $this->adhesionApplicationService->handlePaymentResult(
                    $reference,
                    $status,
                    is_string($reason) ? $reason : null
                );
            } catch (Throwable $exception) {
                error_log(json_encode([
                    'event' => 'dexpay_adhesion_finalization_failed',
                    'reference' => $reference,
                    'exception' => $exception::class,
                    'code' => (string) $exception->getCode(),
                ], JSON_UNESCAPED_SLASHES));

                throw $exception;
            }

            return response()->json([
                'message' => $adhesionUser
                    ? 'Webhook DexPay adhesion traite'
                    : 'Webhook DexPay adhesion traite (paiement non valide).',
                'user' => $adhesionUser,
            ]);
        }

        if (!$this->paiementService->hasPaymentReference($reference)) {
            Log::error('dexpay_webhook_orphaned', [
                'reference' => $reference,
                'event' => $event,
                'provider_status' => $providerStatus,
                'transaction_id' => data_get($payload, 'transaction_id') ?? data_get($payload, 'data.transaction_id'),
                'checkout_session_id' => data_get($payload, 'checkout_session_id') ?? data_get($payload, 'data.checkout_session_id'),
            ]);

            return response()->json([
                'message' => 'Reference DexPay inconnue. Webhook non rapproche.',
            ], 409);
        }

        $paiement = $this->paiementService->traiterPaiement(
            $reference,
            $status,
            is_string($reason) ? $reason : null
        );

        if (!$paiement) {
            return response()->json([
                'message' => 'Webhook DexPay traite (transaction non validee).',
            ]);
        }

        return response()->json([
            'message' => 'Webhook DexPay traite',
            'paiement' => $paiement,
        ]);
    }

    private function dexPaySignature(Request $request, string $configuredHeader): string
    {
        foreach (array_unique([
            $configuredHeader,
            'X-Dexchange-Signature',
            'X-DexPay-Signature',
            'X-Webhook-Signature',
        ]) as $header) {
            $value = (string) $request->header($header, '');
            if ($value !== '') {
                return $value;
            }
        }

        return '';
    }
}
