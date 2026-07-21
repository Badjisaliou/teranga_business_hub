<?php

namespace App\Services;

use App\Models\Cotisation;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CotisationRiskService
{
    public function __construct(
        private readonly BusinessSettingsService $businessSettingsService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function markOverdue(?Carbon $referenceDate = null): int
    {
        $reference = ($referenceDate ?? now())->copy();
        $currentMonth = (int) $reference->format('n');
        $currentYear = (int) $reference->format('Y');

        return Cotisation::query()
            ->whereHas('user', function ($query): void {
                $query->where('role', 'membre')
                    ->where('statut', 'actif');
            })
            ->whereIn('statut', ['non_paye', 'partiel'])
            ->where(function ($query) use ($currentMonth, $currentYear): void {
                $query->where('annee', '<', $currentYear)
                    ->orWhere(function ($q) use ($currentMonth, $currentYear): void {
                        $q->where('annee', '=', $currentYear)
                            ->where('mois', '<', $currentMonth);
                    });
            })
            ->update([
                'statut' => 'en_retard',
                'updated_at' => $reference,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function membersAtRisk(?Carbon $referenceDate = null): Collection
    {
        $reference = ($referenceDate ?? now())->copy();
        $warningThreshold = $this->businessSettingsService->getInt('payment_warning_unsold_months_threshold');

        return $this->membersMatchingThreshold($warningThreshold, $reference);
    }

    public function notifyMembersAtRisk(?Carbon $referenceDate = null): int
    {
        $reference = ($referenceDate ?? now())->copy();
        $warningThreshold = $this->businessSettingsService->getInt('payment_warning_unsold_months_threshold');
        $blockThreshold = $this->businessSettingsService->getInt('auto_block_unsold_months_threshold');
        $sent = 0;

        foreach ($this->membersAtRisk($reference) as $risk) {
            $alreadyNotifiedToday = Notification::query()
                ->where('user_id', $risk['id'])
                ->where('type', 'retard')
                ->whereDate('date_envoi', $reference->toDateString())
                ->where('message', 'like', '%cotisation%')
                ->exists();

            if ($alreadyNotifiedToday) {
                continue;
            }

            $user = User::find((int) $risk['id']);
            if (!$user) {
                continue;
            }

            $this->notificationService->envoyerNotification(
                $user,
                "Vous avez {$risk['mois_non_soldes']} mois de cotisation non solde(s). Une alerte est envoyee a partir de {$warningThreshold} mois, et un blocage manuel peut etre decide a partir de {$blockThreshold} mois non soldes.",
                'retard'
            );
            $sent++;
        }

        return $sent;
    }

    public function blockMembersAtRisk(?Carbon $referenceDate = null): int
    {
        $reference = ($referenceDate ?? now())->copy();
        $threshold = $this->businessSettingsService->getInt('auto_block_unsold_months_threshold');
        $blocked = 0;

        foreach ($this->membersMatchingThreshold($threshold, $reference) as $risk) {
            DB::transaction(function () use ($risk, $threshold, &$blocked): void {
                $user = User::query()
                    ->where('id', (int) $risk['id'])
                    ->where('statut', 'actif')
                    ->lockForUpdate()
                    ->first();

                if (!$user) {
                    return;
                }

                $user->update([
                    'statut' => 'bloque',
                    'api_token' => null,
                    'api_token_created_at' => null,
                ]);

                $this->notificationService->envoyerNotification(
                    $user,
                    "Votre espace membre est bloque pour defaut de paiement (au moins {$threshold} mois non soldes). Merci de contacter la structure Teranga Business Hub.",
                    'retard'
                );

                $blocked++;
            });
        }

        Log::info('memberships_payment_default_blocked', [
            'blocked_count' => $blocked,
            'threshold' => $threshold,
            'executed_at' => $reference->toDateTimeString(),
        ]);

        return $blocked;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function membersMatchingThreshold(int $threshold, Carbon $reference): Collection
    {
        $currentMonth = (int) $reference->format('n');
        $currentYear = (int) $reference->format('Y');

        return User::query()
            ->where('statut', 'actif')
            ->where('role', 'membre')
            ->with(['cotisations' => function ($query) use ($currentMonth, $currentYear): void {
                $query->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])
                    ->where(function ($q) use ($currentMonth, $currentYear): void {
                        $q->where('annee', '<', $currentYear)
                            ->orWhere(function ($q2) use ($currentMonth, $currentYear): void {
                                $q2->where('annee', '=', $currentYear)
                                    ->where('mois', '<', $currentMonth);
                            });
                    })
                    ->orderBy('annee')
                    ->orderBy('mois');
            }])
            ->get()
            ->map(function (User $user) use ($threshold) {
                $impayes = $user->cotisations;
                if ($impayes->count() < $threshold) {
                    return null;
                }

                return [
                    'id' => $user->id,
                    'matricule' => $user->matricule,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'telephone' => $user->telephone,
                    'mois_non_soldes' => $impayes->count(),
                    'seuil_declencheur' => $threshold,
                    'details' => $impayes->map(fn (Cotisation $cotisation) => sprintf('%02d/%d', $cotisation->mois, $cotisation->annee))->values(),
                ];
            })
            ->filter()
            ->values();
    }
}
