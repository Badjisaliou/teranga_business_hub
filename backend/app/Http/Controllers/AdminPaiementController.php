<?php

namespace App\Http\Controllers;

use App\Models\MobileMoneyTransaction;
use App\Models\Paiement;
use App\Models\AdminAction;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminPaiementController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', Rule::in(['adhesion', 'cotisation'])],
            'statut' => ['nullable', Rule::in(['en_attente', 'succes', 'echoue'])],
            'methode_paiement' => ['nullable', Rule::in(['wave', 'orange_money', 'dexpay'])],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'include_repartition' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $baseQuery = Paiement::query()
            ->with(['user:id,matricule,nom,prenom,email', 'cotisation:id,mois,annee,statut,montant_paye']);

        $this->applyFilters($baseQuery, $validated);

        $summaryQuery = Paiement::query();
        $this->applyFilters($summaryQuery, $validated);

        $incidentQuery = MobileMoneyTransaction::query()
            ->with('user:id,matricule,nom,prenom,email')
            ->whereIn('statut', ['en_attente', 'echoue']);
        $this->applyTransactionFilters($incidentQuery, $validated);

        $perPage = (int) ($validated['per_page'] ?? 20);
        $paginator = $baseQuery
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'summary' => [
                'total_count' => (clone $summaryQuery)->count(),
                'success_count' => (clone $summaryQuery)->where('statut', 'succes')->count(),
                'pending_count' => (clone $summaryQuery)->where('statut', 'en_attente')->count(),
                'failed_count' => (clone $summaryQuery)->where('statut', 'echoue')->count(),
                'total_success_amount' => (int) (clone $summaryQuery)->where('statut', 'succes')->sum('montant'),
                'incident_pending_count' => (clone $incidentQuery)->where('statut', 'en_attente')->count(),
                'incident_failed_count' => (clone $incidentQuery)->where('statut', 'echoue')->count(),
            ],
            'incidents' => (clone $incidentQuery)
                ->latest()
                ->take(10)
                ->get()
                ->map(fn (MobileMoneyTransaction $transaction) => [
                    'id' => $transaction->id,
                    'source' => 'transaction',
                    'reference' => $transaction->reference,
                    'type' => $transaction->type,
                    'montant' => (int) $transaction->montant,
                    'methode_paiement' => $transaction->methode_paiement,
                    'canal_paiement' => $transaction->canal_paiement,
                    'statut' => $transaction->statut,
                    'failure_reason' => $transaction->failure_reason,
                    'created_at' => optional($transaction->created_at)->toIso8601String(),
                    'user' => $transaction->user,
                ])
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function relance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:120'],
            'source' => ['nullable', Rule::in(['paiement', 'transaction'])],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $source = $validated['source'] ?? null;
        $reference = (string) $validated['reference'];

        $paymentLike = null;
        if ($source !== 'transaction') {
            $paymentLike = Paiement::with('user')->where('reference', $reference)->first();
        }

        if (!$paymentLike && $source !== 'paiement') {
            $paymentLike = MobileMoneyTransaction::with('user')->where('reference', $reference)->first();
        }

        if (!$paymentLike || !$paymentLike->user) {
            throw ValidationException::withMessages([
                'reference' => ['Paiement introuvable pour cette reference.'],
            ]);
        }

        if (!in_array($paymentLike->statut, ['en_attente', 'echoue'], true)) {
            throw ValidationException::withMessages([
                'statut' => ['La relance est reservee aux paiements en attente ou echoues.'],
            ]);
        }

        $message = isset($validated['message'])
            ? (string) $validated['message']
            : $this->defaultReminderMessage($paymentLike);

        $notification = $this->notificationService->envoyerNotification($paymentLike->user, $message, 'paiement');
        AdminAction::create([
            'admin_id' => $request->user()->id,
            'cible_user_id' => $paymentLike->user->id,
            'action' => 'relance_paiement',
            'description' => "Relance paiement {$paymentLike->reference} ({$paymentLike->statut})",
            'date_action' => now(),
        ]);

        return response()->json([
            'message' => 'Relance envoyee au membre.',
            'notification' => $notification,
        ]);
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function applyFilters($query, array $filters): void
    {
        $includeRepartition = (bool) ($filters['include_repartition'] ?? false);
        if (!$includeRepartition) {
            $query->whereNull('cotisation_id');
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (isset($filters['methode_paiement'])) {
            $query->where('methode_paiement', $filters['methode_paiement']);
        }

        if (isset($filters['date_debut'])) {
            $query->whereDate('created_at', '>=', $filters['date_debut']);
        }

        if (isset($filters['date_fin'])) {
            $query->whereDate('created_at', '<=', $filters['date_fin']);
        }
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function applyTransactionFilters($query, array $filters): void
    {
        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (isset($filters['methode_paiement'])) {
            $query->where('methode_paiement', $filters['methode_paiement']);
        }

        if (isset($filters['date_debut'])) {
            $query->whereDate('created_at', '>=', $filters['date_debut']);
        }

        if (isset($filters['date_fin'])) {
            $query->whereDate('created_at', '<=', $filters['date_fin']);
        }
    }

    private function defaultReminderMessage(Paiement|MobileMoneyTransaction $payment): string
    {
        $type = $payment->type === 'adhesion' ? 'adhesion' : 'cotisation';
        $amount = number_format((int) $payment->montant, 0, ',', ' ');

        if ($payment->statut === 'echoue') {
            $reason = $payment->failure_reason ? " Raison indiquee: {$payment->failure_reason}" : '';

            return "Votre paiement {$type} de {$amount} FCFA a echoue. Reference: {$payment->reference}.{$reason} Vous pouvez relancer un paiement depuis votre espace membre.";
        }

        return "Votre paiement {$type} de {$amount} FCFA est encore en attente de confirmation. Reference: {$payment->reference}. Merci de verifier son statut dans votre espace membre.";
    }
}
