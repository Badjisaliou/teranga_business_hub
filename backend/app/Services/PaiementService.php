<?php

namespace App\Services;

use App\Models\Cotisation;
use App\Models\MobileMoneyTransaction;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaiementService
{
    public const ADHESION_MONTANT = 10000;

    public function __construct(
        private readonly MobileMoneyService $mobileMoneyService,
        private readonly CotisationService $cotisationService,
        private readonly NotificationService $notificationService,
        private readonly UserService $userService,
    ) {
    }

    public function determinerType(User $user): string
    {
        return $user->statut === 'attente_adhesion' ? 'adhesion' : 'cotisation';
    }

    public function initierPaiement(
        User $user,
        string $methodePaiement,
        string $telephone,
        ?string $typeDemande = null,
        ?int $montantDemande = null,
        ?int $nombreCotisations = null,
        ?string $idempotencyKey = null
    ): array
    {
        if ($user->statut === 'en_attente') {
            throw ValidationException::withMessages([
                'user' => ['Compte non valide par un administrateur.'],
            ]);
        }

        if (in_array($user->statut, ['bloque', 'rejete'], true)) {
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
                    ],
                    'provider' => null,
                    'is_replay' => true,
                ];
            }

            $existingTransaction = MobileMoneyTransaction::where('user_id', $user->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingTransaction) {
                $this->guardIdempotencyReplayConsistency(
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
                    ],
                    'provider' => null,
                    'is_replay' => true,
                ];
            }
        }

        $type = $typeDemande ?? $this->determinerType($user);
        $montant = $this->calculerMontant($user, $type, $montantDemande, $nombreCotisations);

        $provider = match ($methodePaiement) {
            'wave' => $this->mobileMoneyService->payerAvecWave($montant, $telephone, ['user_id' => $user->id, 'type' => $type]),
            'orange_money' => $this->mobileMoneyService->payerAvecOrangeMoney($montant, $telephone, ['user_id' => $user->id, 'type' => $type]),
            default => throw ValidationException::withMessages(['methode_paiement' => ['Methode de paiement non supportee.']]),
        };

        if (($provider['status'] ?? 'failed') !== 'success') {
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

        $transaction = MobileMoneyTransaction::create([
            'user_id' => $user->id,
            'type' => $type,
            'montant' => $montant,
            'reference' => $provider['reference'],
            'methode_paiement' => $methodePaiement,
            'statut' => 'en_attente',
            'idempotency_key' => $idempotencyKey,
        ]);

        Log::info('payment_init_created', [
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'type' => $type,
            'amount' => $montant,
            'method' => $methodePaiement,
            'reference' => $transaction->reference,
        ]);

        $shouldAutoConfirmInDev = config('services.mobile_money.mode') === 'dev'
            && (bool) config('services.mobile_money.auto_confirm_dev', true);

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
                    ],
                    'provider' => $provider,
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
            ],
            'provider' => $provider,
            'is_replay' => false,
        ];
    }

    private function calculerMontant(User $user, string $type, ?int $montantDemande, ?int $nombreCotisations): int
    {
        if ($type === 'adhesion') {
            if ($user->statut !== 'attente_adhesion') {
                throw ValidationException::withMessages([
                    'type' => ['Le type adhesion est reserve aux comptes en attente d adhesion.'],
                ]);
            }

            $hasSuccessfulAdhesion = Paiement::where('user_id', $user->id)
                ->where('type', 'adhesion')
                ->where('statut', 'succes')
                ->exists();
            if ($hasSuccessfulAdhesion || $user->date_adhesion !== null) {
                throw ValidationException::withMessages([
                    'type' => ['Les frais d adhesion sont deja regles.'],
                ]);
            }

            $hasPendingAdhesion = Paiement::where('user_id', $user->id)
                ->where('type', 'adhesion')
                ->where('statut', 'en_attente')
                ->exists();
            if ($hasPendingAdhesion) {
                throw ValidationException::withMessages([
                    'type' => ['Un paiement d adhesion est deja en attente de confirmation.'],
                ]);
            }

            return self::ADHESION_MONTANT;
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

        if ($montantDemande === null) {
            if ($nombreCotisations !== null) {
                return $this->cotisationService->montantMensuel() * $nombreCotisations;
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

    public function traiterPaiement(string $reference, string $providerStatut = 'success'): ?Paiement
    {
        return DB::transaction(function () use ($reference, $providerStatut) {
            $paiement = Paiement::where('reference', $reference)->first();
            if ($paiement) {
                if ($paiement->statut === 'succes') {
                    return $paiement;
                }

                if ($providerStatut !== 'success') {
                    $alreadyFailed = $paiement->statut === 'echoue';
                    $paiement->update(['statut' => 'echoue']);
                    if (!$alreadyFailed) {
                        $user = User::findOrFail($paiement->user_id);
                        $this->notificationService->envoyerNotification(
                            $user,
                            'Votre tentative de paiement a echoue. Veuillez reessayer.',
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

                $this->repartirPaiement($user, (int) $paiement->montant, $paiement->methode_paiement, $paiement->reference);
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
                ->firstOrFail();

            $user = User::findOrFail($transaction->user_id);

            if ($providerStatut !== 'success') {
                $alreadyFailed = $transaction->statut === 'echoue';
                $transaction->update(['statut' => 'echoue']);
                if (!$alreadyFailed) {
                    $this->notificationService->envoyerNotification(
                        $user,
                        'Votre tentative de paiement a echoue. Veuillez reessayer.',
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

            $this->repartirPaiement($user, (int) $paiement->montant, $paiement->methode_paiement, $paiement->reference);
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

    public function repartirPaiement(User $user, int $montant, string $methodePaiement, string $referenceParent): void
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

            $montantMensuel = $this->cotisationService->montantMensuel();
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
                'statut' => 'succes',
                'date_paiement' => now(),
            ]);

            $compteur++;
        }
    }

    private function guardIdempotencyReplayConsistency(
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
            $expectedMontant = $this->cotisationService->montantMensuel() * $incomingNombreCotisations;
            if ($existingMontant !== $expectedMontant) {
                throw ValidationException::withMessages([
                    'idempotency_key' => ['Cette cle idempotence est deja utilisee avec des parametres differents.'],
                ]);
            }
        }
    }
}
