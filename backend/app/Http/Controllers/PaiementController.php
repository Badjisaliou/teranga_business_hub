<?php

namespace App\Http\Controllers;

use App\Models\MobileMoneyTransaction;
use App\Models\Paiement;
use App\Services\PaiementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PaiementController extends Controller
{
    public function __construct(private readonly PaiementService $paiementService)
    {
    }

    public function initier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'montant' => ['nullable', 'integer', 'min:100'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'methode_paiement' => ['required', Rule::in(['dexpay'])],
            'canal_paiement' => ['required', Rule::in(config('services.dexpay.channels', ['wave', 'orange_money', 'free_money', 'wizall', 'card']))],
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
            (string) ($request->user()->telephone ?? ''),
            $validated['type'] ?? null,
            isset($validated['montant']) ? (int) $validated['montant'] : null,
            isset($validated['nombre_cotisations']) ? (int) $validated['nombre_cotisations'] : null,
            $idempotencyKey !== '' ? $idempotencyKey : null,
            $validated['canal_paiement']
        );

        return response()->json([
            'message' => 'Paiement initie',
            'paiement' => $result['paiement'],
            'provider' => $result['provider'],
            'checkout_url' => $result['checkout_url'] ?? null,
        ], ($result['is_replay'] ?? false) ? 200 : 201);
    }

    public function historique(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:adhesion,cotisation'],
            'statut' => ['nullable', 'in:en_attente,succes,echoue'],
            'methode_paiement' => ['nullable', Rule::in(['wave', 'orange_money', 'dexpay'])],
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

    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:120'],
        ]);

        $reference = (string) $validated['reference'];
        $user = $request->user();

        $paiement = Paiement::query()
            ->where('user_id', $user->id)
            ->where('reference', $reference)
            ->whereNull('cotisation_id')
            ->first();

        if ($paiement) {
            return response()->json([
                'status' => $paiement->statut,
                'source' => 'paiement',
                'paiement' => [
                    'reference' => $paiement->reference,
                    'type' => $paiement->type,
                    'montant' => (int) $paiement->montant,
                    'methode_paiement' => $paiement->methode_paiement,
                    'canal_paiement' => $paiement->canal_paiement,
                    'statut' => $paiement->statut,
                    'failure_reason' => $paiement->failure_reason,
                    'date_paiement' => optional($paiement->date_paiement)->toIso8601String(),
                ],
            ]);
        }

        $transaction = MobileMoneyTransaction::query()
            ->where('user_id', $user->id)
            ->where('reference', $reference)
            ->first();

        if ($transaction) {
            return response()->json([
                'status' => $transaction->statut,
                'source' => 'transaction',
                'paiement' => [
                    'reference' => $transaction->reference,
                    'type' => $transaction->type,
                    'montant' => (int) $transaction->montant,
                    'methode_paiement' => $transaction->methode_paiement,
                    'canal_paiement' => $transaction->canal_paiement,
                    'statut' => $transaction->statut,
                    'failure_reason' => $transaction->failure_reason,
                    'date_paiement' => null,
                ],
            ]);
        }

        throw ValidationException::withMessages([
            'reference' => ['Paiement introuvable pour cette reference.'],
        ]);
    }

    public function adhesionState(Request $request): JsonResponse
    {
        $user = $request->user();

        $paiement = Paiement::query()
            ->where('user_id', $user->id)
            ->where('type', 'adhesion')
            ->whereNull('cotisation_id')
            ->latest()
            ->first();

        $transaction = MobileMoneyTransaction::query()
            ->where('user_id', $user->id)
            ->where('type', 'adhesion')
            ->latest()
            ->first();

        $latest = collect([$paiement, $transaction])
            ->filter()
            ->sortByDesc(fn ($item) => $item->created_at)
            ->first();

        if (!$latest) {
            return response()->json([
                'has_payment' => false,
                'status' => null,
                'source' => null,
                'paiement' => null,
            ]);
        }

        return response()->json([
            'has_payment' => true,
            'status' => $latest->statut,
            'source' => $latest instanceof Paiement ? 'paiement' : 'transaction',
            'paiement' => [
                'reference' => $latest->reference,
                'type' => $latest->type,
                'montant' => (int) $latest->montant,
                'methode_paiement' => $latest->methode_paiement,
                'canal_paiement' => $latest->canal_paiement,
                'statut' => $latest->statut,
                'failure_reason' => $latest->failure_reason,
                'date_paiement' => $latest instanceof Paiement ? optional($latest->date_paiement)->toIso8601String() : null,
                'created_at' => optional($latest->created_at)->toIso8601String(),
            ],
        ]);
    }

    public function previewCotisation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'montant' => ['required', 'integer', 'min:100'],
        ]);

        if ($request->user()->statut !== 'actif') {
            throw ValidationException::withMessages([
                'user' => ['Le membre doit etre actif pour cotiser.'],
            ]);
        }

        return response()->json(
            $this->paiementService->previsualiserRepartition($request->user(), (int) $validated['montant'])
        );
    }
}
