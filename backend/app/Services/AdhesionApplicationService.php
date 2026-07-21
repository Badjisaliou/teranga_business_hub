<?php

namespace App\Services;

use App\Models\AdhesionApplication;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AdhesionApplicationService
{
    public function __construct(
        private readonly ContactValidationService $contactValidationService,
        private readonly DexPayService $dexPayService,
        private readonly CotisationService $cotisationService,
        private readonly NotificationService $notificationService,
        private readonly PinSecurityService $pinSecurityService,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): AdhesionApplication
    {
        $telephone = $this->normalizeTelephone((string) $payload['telephone']);
        $numeroCni = $this->normalizeCni((string) $payload['numero_cni']);
        $this->pinSecurityService->assertStrong((string) $payload['pin'], [
            ...$payload,
            'telephone' => $telephone,
            'numero_cni' => $numeroCni,
        ]);

        $this->guardUniqueMemberContact($telephone, $numeroCni);
        $resumableApplication = $this->findResumableApplication($telephone, $numeroCni);
        if ($resumableApplication) {
            return $resumableApplication;
        }

        $this->discardIncompleteApplications($telephone, $numeroCni);

        return AdhesionApplication::create([
            'public_id' => (string) Str::uuid(),
            'civilite' => $payload['civilite'],
            'prenom' => $payload['prenom'],
            'nom' => $payload['nom'],
            'date_naissance' => $payload['date_naissance'],
            'telephone' => $telephone,
            'email' => $payload['email'] ?? null,
            'pays_residence' => $payload['pays_residence'],
            'region' => $payload['region'],
            'departement' => $payload['departement'],
            'commune' => $payload['commune'],
            'numero_cni' => $numeroCni,
            'pin_hash' => Hash::make((string) $payload['pin']),
            'conditions_acceptees' => true,
            'statut' => 'draft',
            'montant_adhesion' => PaiementService::ADHESION_MONTANT,
            'expires_at' => now()->addHours($this->expirationHours()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function initiatePayment(AdhesionApplication $application, string $canalPaiement, ?string $idempotencyKey = null): array
    {
        $reservation = DB::transaction(function () use ($application, $canalPaiement): array {
            $lockedApplication = AdhesionApplication::query()
                ->whereKey($application->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedApplication->user_id !== null || $lockedApplication->statut === 'paid') {
                throw ValidationException::withMessages([
                    'adhesion' => ['Cette adhesion est deja finalisee.'],
                ]);
            }

            $checkoutExpired = $lockedApplication->payment_expires_at?->isPast() ?? false;
            if (($lockedApplication->expires_at && $lockedApplication->expires_at->isPast()) || $checkoutExpired) {
                $lockedApplication->update([
                    'statut' => 'expired',
                    'checkout_url' => null,
                    'failure_reason' => 'Session de paiement adhesion expiree sans confirmation DexPay.',
                ]);
                throw ValidationException::withMessages([
                    'adhesion' => ['Cette demande d adhesion a expire. Veuillez recommencer l inscription.'],
                ]);
            }

            if ($lockedApplication->payment_reference) {
                if ($lockedApplication->statut !== 'payment_pending') {
                    throw ValidationException::withMessages([
                        'adhesion' => ['La tentative precedente a echoue. Veuillez recommencer l inscription.'],
                    ]);
                }

                return ['application' => $lockedApplication, 'is_replay' => true];
            }

            $reference = $this->dexPayService->genererReference();
            $lockedApplication->update([
                'statut' => 'payment_pending',
                'payment_reference' => $reference,
                'payment_method' => 'dexpay',
                'payment_channel' => $canalPaiement,
                'checkout_url' => null,
                'payment_expires_at' => now()->addHours($this->expirationHours()),
                'failure_reason' => null,
            ]);

            return ['application' => $lockedApplication->fresh(), 'is_replay' => false];
        });

        $application = $reservation['application'];
        if ($reservation['is_replay']) {
            return [
                'application' => $application->fresh(),
                'provider' => null,
                'checkout_url' => $application->checkout_url,
                'is_replay' => true,
            ];
        }

        try {
            $provider = $this->dexPayService->creerSessionAdhesionApplication(
                $application,
                $canalPaiement,
                ['idempotency_key' => $idempotencyKey],
                (string) $application->payment_reference
            );
        } catch (Throwable $exception) {
            $application->update([
                'statut' => 'failed',
                'failure_reason' => 'La session DexPay adhesion n a pas pu etre creee.',
            ]);

            throw $exception;
        }

        if (($provider['status'] ?? 'failed') !== 'success') {
            $application->update([
                'statut' => 'failed',
                'failure_reason' => $provider['message'] ?? 'Echec de l initiation du paiement adhesion.',
            ]);

            throw ValidationException::withMessages([
                'paiement' => [$provider['message'] ?? 'Echec de l initiation du paiement adhesion.'],
            ]);
        }

        if (($provider['reference'] ?? $application->payment_reference) !== $application->payment_reference) {
            $application->update([
                'statut' => 'failed',
                'failure_reason' => 'La reference retournee par DexPay ne correspond pas a la demande reservee.',
            ]);
            throw ValidationException::withMessages([
                'paiement' => ['Reference DexPay incoherente. Le paiement a ete interrompu avant redirection.'],
            ]);
        }

        $paymentExpiresAt = now()->addHours($this->expirationHours());
        if (isset($provider['expires_at']) && is_string($provider['expires_at'])) {
            try {
                $paymentExpiresAt = Carbon::parse($provider['expires_at']);
            } catch (Throwable) {
                Log::warning('dexpay_adhesion_invalid_expiration', [
                    'reference' => $application->payment_reference,
                    'expires_at' => $provider['expires_at'],
                ]);
            }
        }

        $application->update([
            'checkout_url' => $provider['checkout_url'] ?? null,
            'payment_expires_at' => $paymentExpiresAt,
            'failure_reason' => null,
        ]);

        return [
            'application' => $application->fresh(),
            'provider' => $provider,
            'checkout_url' => $provider['checkout_url'] ?? null,
            'is_replay' => false,
        ];
    }

    public function handlePaymentResult(string $reference, string $providerStatus, ?string $failureReason = null): ?User
    {
        return DB::transaction(function () use ($reference, $providerStatus, $failureReason) {
            $application = AdhesionApplication::query()
                ->where('payment_reference', $reference)
                ->lockForUpdate()
                ->first();

            if (!$application) {
                return null;
            }

            if ($application->user_id !== null) {
                return User::find($application->user_id);
            }

            if ($providerStatus === 'pending') {
                return null;
            }

            if ($providerStatus !== 'success') {
                $application->update([
                    'statut' => 'failed',
                    'checkout_url' => null,
                    'failure_reason' => $failureReason ?? 'DexPay n a pas confirme le paiement adhesion.',
                ]);

                return null;
            }

            $this->guardUniqueMemberContact($application->telephone, $application->numero_cni);

            $user = User::create([
                'matricule' => $this->genererMatricule(),
                'civilite' => $application->civilite,
                'nom' => $application->nom,
                'prenom' => $application->prenom,
                'date_naissance' => $application->date_naissance,
                'email' => $application->email,
                'telephone' => $application->telephone,
                'numero_cni' => $application->numero_cni,
                'pays_residence' => $application->pays_residence,
                'region' => $application->region,
                'departement' => $application->departement,
                'commune' => $application->commune,
                'password' => null,
                'pin_hash' => $application->pin_hash,
                'pin_configured_at' => now(),
                'role' => 'membre',
                'statut' => 'actif',
                'date_adhesion' => now(),
                'date_expiration' => now()->addYear(),
                'card_token' => Str::random(64),
                'card_issued_at' => now(),
            ]);

            Paiement::create([
                'user_id' => $user->id,
                'cotisation_id' => null,
                'type' => 'adhesion',
                'montant' => $application->montant_adhesion,
                'reference' => $reference,
                'methode_paiement' => 'dexpay',
                'canal_paiement' => $application->payment_channel,
                'statut' => 'succes',
                'date_paiement' => now(),
            ]);

            $this->cotisationService->creerEcheancierAnnuelDepuisMoisCourant($user, now());
            $this->notificationService->envoyerNotification(
                $user,
                'Votre adhesion a ete validee. Votre matricule est ' . $user->matricule . '.',
                'paiement'
            );

            $application->update([
                'statut' => 'paid',
                'paid_at' => now(),
                'user_id' => $user->id,
                'pin_hash' => null,
                'checkout_url' => null,
                'failure_reason' => null,
            ]);

            return $user;
        });
    }

    public function hasPaymentReference(string $reference): bool
    {
        return AdhesionApplication::where('payment_reference', $reference)->exists();
    }

    public function expireStaleApplications(): int
    {
        return AdhesionApplication::query()
            ->whereIn('statut', ['draft', 'payment_pending', 'failed'])
            ->where(function ($query): void {
                $query->where(function ($query): void {
                    $query->where('statut', 'payment_pending')
                        ->where(function ($query): void {
                            $query->where('payment_expires_at', '<=', now())
                                ->orWhere(function ($query): void {
                                    $query->whereNull('payment_expires_at')
                                        ->where('expires_at', '<=', now());
                                });
                        });
                })->orWhere(function ($query): void {
                    $query->whereIn('statut', ['draft', 'failed'])
                        ->where('expires_at', '<=', now());
                });
            })
            ->update([
                'statut' => 'expired',
                'failure_reason' => 'Demande expiree automatiquement avant finalisation du paiement.',
                'checkout_url' => null,
                'updated_at' => now(),
            ]);
    }

    private function expirationHours(): int
    {
        return max(1, (int) config('services.adhesion.application_expiration_hours', 24));
    }

    private function normalizeTelephone(string $telephone): string
    {
        $normalized = $this->contactValidationService->normalizeSenegalPhone($telephone);
        if ($normalized === null || !$this->contactValidationService->isValidSenegalPhone($telephone)) {
            throw ValidationException::withMessages([
                'telephone' => ['Le numero de telephone doit etre un numero mobile du Senegal valide.'],
            ]);
        }

        return $normalized;
    }

    private function normalizeCni(string $numeroCni): string
    {
        $normalized = preg_replace('/\s+/', '', $numeroCni) ?? '';
        if (!$this->contactValidationService->isValidSenegalCni($normalized)) {
            throw ValidationException::withMessages([
                'numero_cni' => ['Le numero CNI doit contenir entre 10 et 15 chiffres.'],
            ]);
        }

        return $normalized;
    }

    private function guardUniqueMemberContact(string $telephone, string $numeroCni): void
    {
        if (User::where('telephone', $telephone)->exists()) {
            throw ValidationException::withMessages([
                'telephone' => ['Ce numero de telephone est deja utilise par un membre.'],
            ]);
        }

        if (User::where('numero_cni', $numeroCni)->exists()) {
            throw ValidationException::withMessages([
                'numero_cni' => ['Ce numero CNI est deja utilise par un membre.'],
            ]);
        }
    }

    private function discardIncompleteApplications(string $telephone, string $numeroCni): void
    {
        AdhesionApplication::query()
            ->whereNull('user_id')
            ->whereNull('payment_reference')
            ->whereIn('statut', ['draft', 'failed', 'expired'])
            ->where(function ($query) use ($telephone, $numeroCni): void {
                $query->where('telephone', $telephone)
                    ->orWhere('numero_cni', $numeroCni);
            })
            ->delete();
    }

    private function findResumableApplication(string $telephone, string $numeroCni): ?AdhesionApplication
    {
        return AdhesionApplication::query()
            ->whereNull('user_id')
            ->where('statut', 'payment_pending')
            ->whereNotNull('payment_reference')
            ->where(function ($query) use ($telephone, $numeroCni): void {
                $query->where('telephone', $telephone)
                    ->orWhere('numero_cni', $numeroCni);
            })
            ->latest('id')
            ->first();
    }

    private function genererMatricule(): string
    {
        do {
            $matricule = 'TBH' . now()->format('ymd') . random_int(1000, 9999);
        } while (User::where('matricule', $matricule)->exists());

        return $matricule;
    }
}
