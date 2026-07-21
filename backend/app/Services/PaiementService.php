<?php

namespace App\Services;

use App\Models\Cotisation;
use App\Models\MobileMoneyTransaction;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Carbon;
use Throwable;

class PaiementService
{
    public const ADHESION_MONTANT = 10000;

    public function __construct(
        private readonly MobileMoneyService $mobileMoneyService,
        private readonly DexPayService $dexPayService,
        private readonly CotisationService $cotisationService,
        private readonly NotificationService $notificationService,
        private readonly UserService $userService,
    ) {
    }

    public function determinerType(User $user): string
    {
        return 'cotisation';
    }

    public function initierPaiement(
        User $user,
        string $methodePaiement,
        string $telephone,
        ?string $typeDemande = null,
        ?int $montantDemande = null,
        ?int $nombreCotisations = null,
        ?string $idempotencyKey = null,
        ?string $canalPaiement = null
    ): array
    {
        if ($user->statut === 'bloque') {
            throw ValidationException::withMessages([
                'user' => ['Compte indisponible pour les paiements.'],
            ]);
        }

        $idempotencyKey = $idempotencyKey !== null ? trim($idempotencyKey) : null;
        if ($idempotencyKey === '') {
            $idempotencyKey = null;
        }

        if ($idempotencyKey !== null) {
            $existingPaiement = Paiement::where('user_id', $user->id)
                ->where('idempotency_key', $idempotencyKey)
                ->whereNull('cotisation_id')
                ->first();

            if ($existingPaiement) {
                $this->guardIdempotencyReplayConsistency(
                    $user,
                    $existingPaiement->type,
                    (int) $existingPaiement->montant,
                    $typeDemande,
                    $montantDemande,
                    $nombreCotisations
                );

                return [
                    'paiement' => [
                        'reference' => $existingPaiement->reference,
                        'type' => $existingPaiement->type,
                        'statut' => $existingPaiement->statut,
                        'montant' => (int) $existingPaiement->montant,
                        'methode_paiement' => $existingPaiement->methode_paiement,
                        'canal_paiement' => $existingPaiement->canal_paiement,
                    ],
                    'provider' => null,
                    'checkout_url' => $existingPaiement->methode_paiement === 'dexpay' && $existingPaiement->statut === 'en_attente'
                        ? $this->dexPayService->checkoutUrl($existingPaiement->reference)
                        : null,
                    'is_replay' => true,
                ];
            }

            $existingTransaction = MobileMoneyTransaction::where('user_id', $user->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingTransaction) {
                if ($existingTransaction->statut === 'echoue' && !$existingTransaction->checkout_url) {
                    throw ValidationException::withMessages([
                        'paiement' => ['La tentative precedente a echoue ou a expire. Relancez un nouveau paiement.'],
                    ]);
                }

                $this->guardIdempotencyReplayConsistency(
                    $user,
                    $existingTransaction->type,
                    (int) $existingTransaction->montant,
                    $typeDemande,
                    $montantDemande,
                    $nombreCotisations
                );

                return [
                    'paiement' => [
                        'reference' => $existingTransaction->reference,
                        'type' => $existingTransaction->type,
                        'statut' => $existingTransaction->statut,
                        'montant' => (int) $existingTransaction->montant,
                        'methode_paiement' => $existingTransaction->methode_paiement,
                        'canal_paiement' => $existingTransaction->canal_paiement,
                    ],
                    'provider' => null,
                    'checkout_url' => $existingTransaction->checkout_url,
                    'is_replay' => true,
                ];
            }
        }

        $type = $typeDemande ?? $this->determinerType($user);
        $montant = $this->calculerMontant($user, $type, $montantDemande, $nombreCotisations);

        if ($methodePaiement !== 'dexpay') {
            throw ValidationException::withMessages(['methode_paiement' => ['Methode de paiement non supportee.']]);
        }

        $reference = $this->dexPayService->genererReference();
        $transaction = MobileMoneyTransaction::create([
            'user_id' => $user->id,
            'type' => $type,
            'montant' => $montant,
            'reference' => $reference,
            'methode_paiement' => $methodePaiement,
            'canal_paiement' => $canalPaiement,
            'statut' => 'en_attente',
            'idempotency_key' => $idempotencyKey,
            'expires_at' => now()->addHours($this->pendingExpirationHours()),
        ]);

        try {
            $provider = $this->dexPayService->creerSession(
                $user,
                $montant,
                $type,
                $canalPaiement,
                ['idempotency_key' => $idempotencyKey],
                $reference
            );
        } catch (Throwable $exception) {
            $transaction->update([
                'statut' => 'echoue',
                'failure_reason' => 'La session DexPay n a pas pu etre creee.',
            ]);

            throw $exception;
        }

        if (($provider['status'] ?? 'failed') !== 'success') {
            $transaction->update([
                'statut' => 'echoue',
                'failure_reason' => $provider['message'] ?? 'Echec de l initiation DexPay.',
            ]);
            Log::warning('payment_init_failed_provider_response', [
                'user_id' => $user->id,
                'method' => $methodePaiement,
                'type' => $type,
                'provider_status' => $provider['status'] ?? null,
                'provider_message' => $provider['message'] ?? null,
            ]);
            throw ValidationException::withMessages([
                'paiement' => [$provider['message'] ?? 'Echec de l initiation'],
            ]);
        }

        if (($provider['reference'] ?? $reference) !== $reference) {
            $transaction->update([
                'statut' => 'echoue',
                'failure_reason' => 'La reference retournee par DexPay ne correspond pas a la reference reservee.',
            ]);

            throw ValidationException::withMessages([
                'paiement' => ['Reference DexPay incoherente. Le paiement a ete interrompu avant redirection.'],
            ]);
        }

        $providerExpiresAt = now()->addHours($this->pendingExpirationHours());
        if (isset($provider['expires_at']) && is_string($provider['expires_at'])) {
            try {
                $providerExpiresAt = Carbon::parse($provider['expires_at']);
            } catch (Throwable) {
                Log::warning('dexpay_checkout_invalid_expiration', [
                    'reference' => $reference,
                    'expires_at' => $provider['expires_at'],
                ]);
            }
        }

        $transaction->update([
            'checkout_url' => $provider['checkout_url'] ?? null,
            'expires_at' => $providerExpiresAt,
            'failure_reason' => null,
        ]);

        Log::info('payment_init_created', [
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'type' => $type,
            'amount' => $montant,
            'method' => $methodePaiement,
            'channel' => $canalPaiement,
            'reference' => $transaction->reference,
        ]);

        $shouldAutoConfirmInDev = config('services.mobile_money.mode') === 'dev'
            && (
                ($methodePaiement !== 'dexpay' && (bool) config('services.mobile_money.auto_confirm_dev', true))
                || ($methodePaiement === 'dexpay' && (bool) config('services.dexpay.auto_confirm_dev', false))
            );

        if ($shouldAutoConfirmInDev) {
            $confirmed = $this->traiterPaiement((string) $transaction->reference, 'success');

            if ($confirmed) {
                return [
                    'paiement' => [
                        'reference' => $confirmed->reference,
                        'type' => $confirmed->type,
                        'statut' => $confirmed->statut,
                        'montant' => (int) $confirmed->montant,
                        'methode_paiement' => $confirmed->methode_paiement,
                        'canal_paiement' => $confirmed->canal_paiement,
                    ],
                    'provider' => $provider,
                    'checkout_url' => $provider['checkout_url'] ?? null,
                    'is_replay' => false,
                ];
            }
        }

        return [
            'paiement' => [
                'reference' => $transaction->reference,
                'type' => $transaction->type,
                'statut' => 'en_attente',
                'montant' => (int) $transaction->montant,
                'methode_paiement' => $transaction->methode_paiement,
                'canal_paiement' => $transaction->canal_paiement,
            ],
            'provider' => $provider,
            'checkout_url' => $provider['checkout_url'] ?? null,
            'is_replay' => false,
        ];
    }

    private function calculerMontant(User $user, string $type, ?int $montantDemande, ?int $nombreCotisations): int
    {
        if ($type === 'adhesion') {
            throw ValidationException::withMessages([
                'type' => ['Le paiement d adhesion se fait uniquement pendant l inscription.'],
            ]);
        }

        if ($type !== 'cotisation') {
            throw ValidationException::withMessages([
                'type' => ['Type de paiement non supporte.'],
            ]);
        }

        if ($user->statut !== 'actif') {
            throw ValidationException::withMessages([
                'user' => ['Le membre doit etre actif pour cotiser.'],
            ]);
        }

        if ($user->cotisation_montant_mensuel === null) {
            throw ValidationException::withMessages([
                'cotisation_montant_mensuel' => ['Choisissez votre cotisation mensuelle avant de commencer a cotiser.'],
            ]);
        }

        if ($montantDemande === null) {
            if ($nombreCotisations !== null) {
                return $this->cotisationService->montantMensuel($user) * $nombreCotisations;
            }

            throw ValidationException::withMessages([
                'montant' => ['Le montant est requis pour une cotisation.'],
            ]);
        }

        if ($montantDemande <= 0) {
            throw ValidationException::withMessages([
                'montant' => ['Le montant doit etre strictement positif.'],
            ]);
        }

        return $montantDemande;
    }

    public function traiterPaiement(string $reference, string $providerStatut = 'success', ?string $failureReason = null): ?Paiement
    {
        return DB::transaction(function () use ($reference, $providerStatut, $failureReason) {
            $existingPaiement = Paiement::where('reference', $reference)->first();
            $existingTransaction = MobileMoneyTransaction::where('reference', $reference)->first();
            $userId = $existingPaiement?->user_id ?? $existingTransaction?->user_id;

            if ($userId === null) {
                Log::warning('payment_processing_reference_disappeared', ['reference' => $reference]);
                return null;
            }

            User::query()->whereKey($userId)->lockForUpdate()->firstOrFail();

            $paiement = Paiement::where('reference', $reference)->first();
            if ($paiement) {
                if ($paiement->statut === 'succes') {
                    return $paiement;
                }

                if ($providerStatut !== 'success') {
                    $alreadyFailed = $paiement->statut === 'echoue';
                    $paiement->update([
                        'statut' => 'echoue',
                        'failure_reason' => $failureReason ?? $this->defaultFailureReason($paiement->methode_paiement),
                    ]);
                    if (!$alreadyFailed) {
                        $user = User::findOrFail($paiement->user_id);
                        $this->notificationService->envoyerNotification(
                            $user,
                            $this->failureNotificationMessage($paiement->reference, $paiement->methode_paiement, $failureReason),
                            'paiement'
                        );
                    }
                    return null;
                }

                $paiement->update(['statut' => 'succes', 'date_paiement' => now()]);
                $user = User::findOrFail($paiement->user_id);

                if ($paiement->type === 'adhesion') {
                    $this->userService->activerCompte($user);
                    $this->notificationService->envoyerNotification($user, 'Votre adhesion a ete validee.', 'paiement');
                    Log::info('payment_adhesion_processed', [
                        'paiement_id' => $paiement->id,
                        'user_id' => $user->id,
                        'reference' => $paiement->reference,
                    ]);
                    return $paiement->refresh();
                }

                $this->repartirPaiement($user, (int) $paiement->montant, $paiement->methode_paiement, $paiement->reference, $paiement->canal_paiement);
                $this->notificationService->envoyerNotification($user, 'Votre cotisation a ete validee.', 'paiement');
                Log::info('payment_cotisation_processed', [
                    'paiement_id' => $paiement->id,
                    'user_id' => $user->id,
                    'reference' => $paiement->reference,
                    'amount' => (int) $paiement->montant,
                ]);
                return $paiement->refresh();
            }

            $transaction = MobileMoneyTransaction::where('reference', $reference)
                ->lockForUpdate()
                ->first();

            if (!$transaction) {
                return Paiement::where('reference', $reference)->first();
            }

            $user = User::findOrFail($transaction->user_id);

            if ($providerStatut !== 'success') {
                $alreadyFailed = $transaction->statut === 'echoue';
                $transaction->update([
                    'statut' => 'echoue',
                    'failure_reason' => $failureReason ?? $this->defaultFailureReason($transaction->methode_paiement),
                ]);
                if (!$alreadyFailed) {
                    $this->notificationService->envoyerNotification(
                        $user,
                        $this->failureNotificationMessage($transaction->reference, $transaction->methode_paiement, $failureReason),
                        'paiement'
                    );
                }
                Log::warning('payment_processing_failed', [
                    'reference' => $reference,
                    'user_id' => $user->id,
                    'provider_status' => $providerStatut,
                ]);

                return null;
            }

            $paiement = Paiement::create([
                'user_id' => $transaction->user_id,
                'cotisation_id' => null,
                'type' => $transaction->type,
                'montant' => $transaction->montant,
                'reference' => $transaction->reference,
                'methode_paiement' => $transaction->methode_paiement,
                'canal_paiement' => $transaction->canal_paiement,
                'statut' => 'succes',
                'date_paiement' => now(),
                'idempotency_key' => $transaction->idempotency_key,
            ]);

            if ($paiement->type === 'adhesion') {
                $this->userService->activerCompte($user);
                $this->notificationService->envoyerNotification($user, 'Votre adhesion a ete validee.', 'paiement');
                Log::info('payment_adhesion_processed', [
                    'paiement_id' => $paiement->id,
                    'user_id' => $user->id,
                    'reference' => $paiement->reference,
                ]);
                $transaction->delete();
                return $paiement;
            }

            $this->repartirPaiement($user, (int) $paiement->montant, $paiement->methode_paiement, $paiement->reference, $paiement->canal_paiement);
            $this->notificationService->envoyerNotification($user, 'Votre cotisation a ete validee.', 'paiement');
            Log::info('payment_cotisation_processed', [
                'paiement_id' => $paiement->id,
                'user_id' => $user->id,
                'reference' => $paiement->reference,
                'amount' => (int) $paiement->montant,
            ]);
            $transaction->delete();
            return $paiement;
        });
    }

    public function hasPaymentReference(string $reference): bool
    {
        return Paiement::where('reference', $reference)->exists()
            || MobileMoneyTransaction::where('reference', $reference)->exists();
    }

    public function expireStaleTransactions(): int
    {
        $fallbackCutoff = now()->subHours($this->pendingExpirationHours());

        return MobileMoneyTransaction::query()
            ->where('statut', 'en_attente')
            ->where(function ($query) use ($fallbackCutoff): void {
                $query->where('expires_at', '<=', now())
                    ->orWhere(function ($query) use ($fallbackCutoff): void {
                        $query->whereNull('expires_at')->where('created_at', '<=', $fallbackCutoff);
                    });
            })
            ->update([
                'statut' => 'echoue',
                'failure_reason' => 'Session de paiement expiree sans confirmation DexPay.',
                'checkout_url' => null,
                'updated_at' => now(),
            ]);
    }

    private function pendingExpirationHours(): int
    {
        return max(1, (int) config('services.dexpay.pending_expiration_hours', 24));
    }

    public function repartirPaiement(User $user, int $montant, string $methodePaiement, string $referenceParent, ?string $canalPaiement = null): void
    {
        $resteGlobal = $montant;
        $compteur = 1;

        while ($resteGlobal > 0) {

            $cotisation = Cotisation::where('user_id', $user->id)
                ->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])
                ->orderBy('annee')
                ->orderBy('mois')
                ->first();

            if (!$cotisation) {
                $cotisation = $this->cotisationService->getCotisationCourante($user);
                if ($cotisation->statut === 'a_jour') {
                    $next = now()->setDate($cotisation->annee, $cotisation->mois, 1)->addMonth();
                    $cotisation = $this->cotisationService->creerCotisation($user, (int) $next->format('n'), (int) $next->format('Y'));
                }
            }

            $montantMensuel = $this->cotisationService->montantMensuel($user);
            $resteCotisation = $montantMensuel - (int) $cotisation->montant_paye;
            $affecter = min($resteGlobal, $resteCotisation);

            if ($affecter <= 0) {
                throw ValidationException::withMessages([
                    'cotisation' => ['Impossible de repartir le montant de cotisation.'],
                ]);
            }

            $resteGlobal -= $affecter;

            $nouveauMontant = (int) $cotisation->montant_paye + $affecter;
            $cotisation->update([
                'montant_paye' => $nouveauMontant,
                'statut' => $nouveauMontant >= $montantMensuel ? 'a_jour' : 'partiel',
            ]);

            Paiement::create([
                'user_id' => $user->id,
                'cotisation_id' => $cotisation->id,
                'type' => 'cotisation',
                'montant' => $affecter,
                'reference' => $referenceParent . '-COT-' . $cotisation->id . '-' . $compteur,
                'methode_paiement' => $methodePaiement,
                'canal_paiement' => $canalPaiement,
                'statut' => 'succes',
                'date_paiement' => now(),
            ]);

            $compteur++;
        }
    }

    /**
     * @return array{montant: int, montant_mensuel: int, total_a_solder: int, repartition: list<array<string, mixed>>, reste_non_affecte: int}
     */
    public function previsualiserRepartition(User $user, int $montant): array
    {
        if ($montant <= 0) {
            throw ValidationException::withMessages([
                'montant' => ['Le montant doit etre strictement positif.'],
            ]);
        }

        if ($user->cotisation_montant_mensuel === null) {
            throw ValidationException::withMessages([
                'cotisation_montant_mensuel' => ['Choisissez votre cotisation mensuelle avant de commencer a cotiser.'],
            ]);
        }

        $montantMensuel = $this->cotisationService->montantMensuel($user);
        $resteGlobal = $montant;
        $repartition = [];

        $cotisations = Cotisation::where('user_id', $user->id)
            ->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])
            ->orderBy('annee')
            ->orderBy('mois')
            ->get();
        $totalASolder = $cotisations->sum(fn (Cotisation $cotisation) => max($montantMensuel - (int) $cotisation->montant_paye, 0));

        if ($cotisations->isEmpty()) {
            $courante = $this->cotisationService->getCotisationCourante($user);
            $cotisations = collect([$courante]);
            $totalASolder = max($montantMensuel - (int) $courante->montant_paye, 0);
        }

        $lastCotisation = $cotisations->last();
        while ($resteGlobal > 0) {
            $cotisation = $cotisations->shift();

            if (!$cotisation) {
                if (!$lastCotisation) {
                    break;
                }

                $next = now()->setDate((int) $lastCotisation->annee, (int) $lastCotisation->mois, 1)->addMonth();
                $cotisation = new Cotisation([
                    'user_id' => $user->id,
                    'mois' => (int) $next->format('n'),
                    'annee' => (int) $next->format('Y'),
                    'montant_paye' => 0,
                    'statut' => 'non_paye',
                ]);
                $lastCotisation = $cotisation;
            }

            $dejaPaye = (int) $cotisation->montant_paye;
            $resteCotisation = max($montantMensuel - $dejaPaye, 0);
            if ($resteCotisation <= 0) {
                continue;
            }

            $affecter = min($resteGlobal, $resteCotisation);
            $nouveauMontant = $dejaPaye + $affecter;
            $resteGlobal -= $affecter;

            $repartition[] = [
                'cotisation_id' => $cotisation->exists ? $cotisation->id : null,
                'mois' => (int) $cotisation->mois,
                'annee' => (int) $cotisation->annee,
                'statut_initial' => $cotisation->statut,
                'montant_deja_paye' => $dejaPaye,
                'montant_affecte' => $affecter,
                'montant_apres_paiement' => $nouveauMontant,
                'statut_apres_paiement' => $nouveauMontant >= $montantMensuel ? 'a_jour' : 'partiel',
            ];
        }

        return [
            'montant' => $montant,
            'montant_mensuel' => $montantMensuel,
            'total_a_solder' => $totalASolder,
            'repartition' => $repartition,
            'reste_non_affecte' => $resteGlobal,
        ];
    }

    private function guardIdempotencyReplayConsistency(
        User $user,
        string $existingType,
        int $existingMontant,
        ?string $incomingType,
        ?int $incomingMontant,
        ?int $incomingNombreCotisations
    ): void
    {
        if ($incomingType !== null && $existingType !== $incomingType) {
            throw ValidationException::withMessages([
                'idempotency_key' => ['Cette cle idempotence est deja utilisee avec des parametres differents.'],
            ]);
        }

        if ($incomingMontant !== null && $existingMontant !== $incomingMontant) {
            throw ValidationException::withMessages([
                'idempotency_key' => ['Cette cle idempotence est deja utilisee avec des parametres differents.'],
            ]);
        }

        if ($incomingMontant === null && $incomingNombreCotisations !== null) {
            $expectedMontant = $this->cotisationService->montantMensuel($user) * $incomingNombreCotisations;
            if ($existingMontant !== $expectedMontant) {
                throw ValidationException::withMessages([
                    'idempotency_key' => ['Cette cle idempotence est deja utilisee avec des parametres differents.'],
                ]);
            }
        }
    }

    private function defaultFailureReason(string $methodePaiement): string
    {
        return $methodePaiement === 'dexpay'
            ? 'DexPay n a pas confirme le paiement. Il peut s agir d une annulation, d un solde insuffisant ou d une confirmation non finalisee.'
            : 'L operateur de paiement n a pas confirme la transaction.';
    }

    private function failureNotificationMessage(string $reference, string $methodePaiement, ?string $failureReason): string
    {
        $reason = $failureReason ?? $this->defaultFailureReason($methodePaiement);

        return "Votre paiement a echoue. Reference: {$reference}. Raison: {$reason} Vous pouvez relancer une nouvelle demande depuis votre espace membre.";
    }
}
