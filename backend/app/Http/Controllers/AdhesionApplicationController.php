<?php

namespace App\Http\Controllers;

use App\Models\AdhesionApplication;
use App\Services\AdhesionApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdhesionApplicationController extends Controller
{
    public function __construct(private readonly AdhesionApplicationService $adhesionApplicationService)
    {
    }

    public function start(Request $request): JsonResponse
    {
        $adultBirthDate = now()->subYears(18)->toDateString();

        $validated = $request->validate([
            'civilite' => ['required', 'string', 'max:20'],
            'prenom' => ['required', 'string', 'max:255'],
            'nom' => ['required', 'string', 'max:255'],
            'date_naissance' => ['required', 'date', 'before_or_equal:'.$adultBirthDate],
            'telephone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'pays_residence' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:255'],
            'departement' => ['required', 'string', 'max:255'],
            'commune' => ['required', 'string', 'max:255'],
            'numero_cni' => ['required', 'string', 'max:50'],
            'pin' => ['required', 'string', 'regex:/^[0-9]{6}$/', 'confirmed'],
            'conditions_acceptees' => ['accepted'],
        ]);

        $application = $this->adhesionApplicationService->create($validated);

        return response()->json([
            'message' => 'Demande d adhesion creee.',
            'application' => $this->serializeApplication($application),
        ], 201);
    }

    public function pay(Request $request, string $publicId): JsonResponse
    {
        $validated = $request->validate([
            'canal_paiement' => ['required', Rule::in(config('services.dexpay.channels', ['wave', 'orange_money', 'free_money', 'wizall', 'card']))],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
        ]);

        $application = AdhesionApplication::where('public_id', $publicId)->firstOrFail();
        $idempotencyKey = (string) ($request->header('Idempotency-Key') ?? '');
        if ($idempotencyKey === '') {
            $idempotencyKey = isset($validated['idempotency_key']) ? (string) $validated['idempotency_key'] : '';
        }

        $result = $this->adhesionApplicationService->initiatePayment(
            $application,
            (string) $validated['canal_paiement'],
            $idempotencyKey !== '' ? $idempotencyKey : null,
        );

        return response()->json([
            'message' => 'Paiement adhesion initie.',
            'application' => $this->serializeApplication($result['application']),
            'provider' => $result['provider'],
            'checkout_url' => $result['checkout_url'] ?? null,
        ], ($result['is_replay'] ?? false) ? 200 : 201);
    }

    public function status(string $publicId): JsonResponse
    {
        $application = AdhesionApplication::with('user')->where('public_id', $publicId)->firstOrFail();

        return response()->json([
            'application' => $this->serializeApplication($application),
            'member' => $application->user ? [
                'id' => $application->user->id,
                'matricule' => $application->user->matricule,
                'nom' => $application->user->nom,
                'prenom' => $application->user->prenom,
                'statut' => $application->user->statut,
                'date_expiration' => optional($application->user->date_expiration)->toDateString(),
            ] : null,
        ]);
    }

    public function statusByReference(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:120'],
        ]);

        $application = AdhesionApplication::with('user')
            ->where('payment_reference', (string) $validated['reference'])
            ->firstOrFail();

        return response()->json([
            'application' => $this->serializeApplication($application),
            'member' => $application->user ? [
                'id' => $application->user->id,
                'matricule' => $application->user->matricule,
                'nom' => $application->user->nom,
                'prenom' => $application->user->prenom,
                'statut' => $application->user->statut,
                'date_expiration' => optional($application->user->date_expiration)->toDateString(),
            ] : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeApplication(AdhesionApplication $application): array
    {
        return [
            'public_id' => $application->public_id,
            'statut' => $application->statut,
            'montant_adhesion' => $application->montant_adhesion,
            'payment_reference' => $application->payment_reference,
            'payment_method' => $application->payment_method,
            'payment_channel' => $application->payment_channel,
            'failure_reason' => $application->failure_reason,
            'payment_expires_at' => optional($application->payment_expires_at)->toIso8601String(),
            'expires_at' => optional($application->expires_at)->toIso8601String(),
            'paid_at' => optional($application->paid_at)->toIso8601String(),
            'user_id' => $application->user_id,
        ];
    }
}
