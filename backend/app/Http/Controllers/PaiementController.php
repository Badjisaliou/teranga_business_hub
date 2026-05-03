<?php

namespace App\Http\Controllers;

use App\Services\PaiementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function __construct(private readonly PaiementService $paiementService)
    {
    }

    public function initier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'montant' => ['nullable', 'integer', 'min:100'],
            'telephone' => ['required', 'string', 'max:30'],
            'methode_paiement' => ['required', 'in:wave,orange_money'],
            'type' => ['nullable', 'in:adhesion,cotisation'],
            'nombre_cotisations' => ['nullable', 'integer', 'min:1', 'max:12'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
        ]);

        $idempotencyKey = (string) ($request->header('Idempotency-Key') ?? '');
        if ($idempotencyKey === '') {
            $idempotencyKey = isset($validated['idempotency_key']) ? (string) $validated['idempotency_key'] : '';
        }

        $result = $this->paiementService->initierPaiement(
            $request->user(),
            $validated['methode_paiement'],
            $validated['telephone'],
            $validated['type'] ?? null,
            isset($validated['montant']) ? (int) $validated['montant'] : null,
            isset($validated['nombre_cotisations']) ? (int) $validated['nombre_cotisations'] : null,
            $idempotencyKey !== '' ? $idempotencyKey : null
        );

        return response()->json([
            'message' => 'Paiement initie',
            'paiement' => $result['paiement'],
            'provider' => $result['provider'],
        ], ($result['is_replay'] ?? false) ? 200 : 201);
    }

    public function historique(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:adhesion,cotisation'],
            'statut' => ['nullable', 'in:en_attente,succes,echoue'],
            'methode_paiement' => ['nullable', 'in:wave,orange_money'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'include_repartition' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = \App\Models\Paiement::query()
            ->where('user_id', $request->user()->id)
            ->with('cotisation:id,user_id,mois,annee,statut,montant_paye');

        $includeRepartition = (bool) ($validated['include_repartition'] ?? false);
        if (!$includeRepartition) {
            $query->whereNull('cotisation_id');
        }

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['statut'])) {
            $query->where('statut', $validated['statut']);
        }

        if (isset($validated['methode_paiement'])) {
            $query->where('methode_paiement', $validated['methode_paiement']);
        }

        if (isset($validated['date_debut'])) {
            $query->whereDate('created_at', '>=', $validated['date_debut']);
        }

        if (isset($validated['date_fin'])) {
            $query->whereDate('created_at', '<=', $validated['date_fin']);
        }

        $perPage = (int) ($validated['per_page'] ?? 15);
        $paginator = $query
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
