<?php

namespace App\Http\Controllers;

use App\Services\MobileMoneyService;
use App\Services\PaiementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(
        private readonly PaiementService $paiementService,
        private readonly MobileMoneyService $mobileMoneyService,
    ) {
    }

    public function mobileMoney(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:100'],
            'status' => ['required', 'in:success,failed,echoue'],
        ]);

        $normalized = $this->mobileMoneyService->traiterWebhook($validated);
        $status = $normalized['status'] === 'success' ? 'success' : 'failed';
        $paiement = $this->paiementService->traiterPaiement(
            (string) $normalized['reference'],
            $status
        );

        if (!$paiement) {
            return response()->json([
                'message' => 'Webhook traite (transaction echouee, aucun paiement enregistre).',
            ]);
        }

        return response()->json(['message' => 'Webhook traite', 'paiement' => $paiement]);
    }
}
