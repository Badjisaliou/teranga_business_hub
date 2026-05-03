<?php

namespace App\Http\Controllers;

use App\Models\Cotisation;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CotisationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cotisations = Cotisation::where('user_id', $request->user()->id)
            ->with(['paiements' => function ($query) {
                $query->orderByDesc('date_paiement')
                    ->orderByDesc('created_at');
            }])
            ->orderByDesc('annee')
            ->orderByDesc('mois')
            ->get();

        $data = $cotisations->map(function (Cotisation $cotisation) {
            return [
                'id' => $cotisation->id,
                'mois' => $cotisation->mois,
                'annee' => $cotisation->annee,
                'montant_paye' => $cotisation->montant_paye,
                'statut' => $cotisation->statut,
                'paiements_associes' => $cotisation->paiements->map(function (Paiement $paiement) {
                    return [
                        'id' => $paiement->id,
                        'reference' => $paiement->reference,
                        'montant' => $paiement->montant,
                        'statut' => $paiement->statut,
                        'methode_paiement' => $paiement->methode_paiement,
                        'date_paiement' => optional($paiement->date_paiement)->toISOString(),
                        'created_at' => optional($paiement->created_at)->toISOString(),
                    ];
                })->values(),
            ];
        })->values();

        return response()->json(['data' => $data]);
    }

    public function transparence(): JsonResponse
    {
        $data = Cotisation::query()
            ->join('users', 'users.id', '=', 'cotisations.user_id')
            ->orderByDesc('cotisations.annee')
            ->orderByDesc('cotisations.mois')
            ->orderByDesc('cotisations.updated_at')
            ->limit(200)
            ->get([
                'users.matricule',
                'cotisations.mois',
                'cotisations.annee',
                'cotisations.montant_paye',
                'cotisations.statut',
                'cotisations.updated_at as date_mise_a_jour',
            ]);

        $paiements = Paiement::query()
            ->join('users', 'users.id', '=', 'paiements.user_id')
            ->join('cotisations', 'cotisations.id', '=', 'paiements.cotisation_id')
            ->where('paiements.type', 'cotisation')
            ->whereNotNull('paiements.cotisation_id')
            ->where('paiements.statut', 'succes')
            ->orderByDesc('cotisations.annee')
            ->orderByDesc('cotisations.mois')
            ->orderByDesc('paiements.date_paiement')
            ->get([
                'cotisations.mois',
                'cotisations.annee',
                'users.matricule',
                'paiements.reference',
                'paiements.montant',
                'paiements.methode_paiement',
                'paiements.statut',
                'paiements.date_paiement',
                'paiements.created_at',
            ]);

        $grouped = $paiements
            ->groupBy(fn ($item) => sprintf('%04d-%02d', (int) $item->annee, (int) $item->mois))
            ->map(function ($items, $key) {
                $first = $items->first();
                $totalMontant = $items->sum(fn ($row) => (int) $row->montant);

                return [
                    'key' => $key,
                    'mois' => (int) $first->mois,
                    'annee' => (int) $first->annee,
                    'total_montant' => $totalMontant,
                    'nombre_paiements' => $items->count(),
                    'paiements' => $items->map(function ($row) {
                        return [
                            'matricule' => $row->matricule,
                            'reference' => $row->reference,
                            'montant' => (int) $row->montant,
                            'methode_paiement' => $row->methode_paiement,
                            'statut' => $row->statut,
                            'date_paiement' => $row->date_paiement,
                            'created_at' => $row->created_at,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'data' => $data,
            'paiements_par_mois' => $grouped,
        ]);
    }
}
