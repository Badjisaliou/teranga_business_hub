<?php

namespace App\Services;

use App\Models\Cotisation;
use App\Models\User;
use Carbon\Carbon;

class CotisationService
{
    public const MONTANT_MENSUEL = 20000;

    public function __construct(
        private readonly BusinessSettingsService $businessSettingsService,
    ) {
    }

    public function montantMensuel(): int
    {
        return $this->businessSettingsService->getInt('cotisation_montant_mensuel');
    }

    public function getCotisationCourante(User $user): Cotisation
    {
        return Cotisation::firstOrCreate(
            [
                'user_id' => $user->id,
                'mois' => (int) now()->format('n'),
                'annee' => (int) now()->format('Y'),
            ],
            [
                'montant_paye' => 0,
                'statut' => 'non_paye',
            ]
        );
    }

    public function creerCotisation(User $user, int $mois, int $annee): Cotisation
    {
        return Cotisation::firstOrCreate(
            [
                'user_id' => $user->id,
                'mois' => $mois,
                'annee' => $annee,
            ],
            [
                'montant_paye' => 0,
                'statut' => 'non_paye',
            ]
        );
    }

    public function creerEcheancierAnnuelDepuisMoisSuivant(User $user, ?Carbon $referenceDate = null): void
    {
        $base = ($referenceDate ?? now())->copy()->startOfMonth()->addMonth();

        for ($i = 0; $i < 12; $i++) {
            $target = $base->copy()->addMonths($i);
            $this->creerCotisation(
                $user,
                (int) $target->format('n'),
                (int) $target->format('Y')
            );
        }
    }

    public function creerEcheancierAnnuelDepuisMoisCourant(User $user, ?Carbon $referenceDate = null): void
    {
        $base = ($referenceDate ?? now())->copy()->startOfMonth();

        for ($i = 0; $i < 12; $i++) {
            $target = $base->copy()->addMonths($i);
            $this->creerCotisation(
                $user,
                (int) $target->format('n'),
                (int) $target->format('Y')
            );
        }
    }
}
