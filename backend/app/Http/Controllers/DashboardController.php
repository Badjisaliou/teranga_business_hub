<?php

namespace App\Http\Controllers;

use App\Models\AdminAction;
use App\Models\Cotisation;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\User;
use App\Services\BusinessSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly BusinessSettingsService $businessSettingsService,
    ) {
    }

    public function userDashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user,
            'stats' => [
                'total_paiements_succes' => Paiement::where('user_id', $user->id)
                    ->whereNull('cotisation_id')
                    ->where('statut', 'succes')
                    ->sum('montant'),
                'cotisations_a_jour' => Cotisation::where('user_id', $user->id)->where('statut', 'a_jour')->count(),
                'cotisations_non_soldees' => Cotisation::where('user_id', $user->id)->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])->count(),
                'notifications_non_lues' => Notification::where('user_id', $user->id)->where('statut', 'non_lu')->count(),
            ],
            'derniers_paiements' => Paiement::where('user_id', $user->id)
                ->whereNull('cotisation_id')
                ->latest()
                ->take(10)
                ->get(),
            'dernieres_notifications' => $user->notificationsMetier()->latest()->take(10)->get(),
        ]);
    }

    public function adminDashboard(): JsonResponse
    {
        $currentMonth = (int) now()->format('n');
        $currentYear = (int) now()->format('Y');
        $threshold = $this->businessSettingsService->getInt('auto_block_unsold_months_threshold');

        $membresABloquerDefautPaiement = User::query()
            ->where('statut', 'actif')
            ->with(['cotisations' => function ($query) use ($currentMonth, $currentYear) {
                $query->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])
                    ->where(function ($q) use ($currentMonth, $currentYear) {
                        $q->where('annee', '<', $currentYear)
                            ->orWhere(function ($q2) use ($currentMonth, $currentYear) {
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
                    'details' => $impayes->map(fn (Cotisation $c) => sprintf('%02d/%d', $c->mois, $c->annee))->values(),
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'kpis' => [
                'total_utilisateurs' => User::count(),
                'utilisateurs_actifs' => User::where('statut', 'actif')->count(),
                'utilisateurs_bloques' => User::where('statut', 'bloque')->count(),
                'paiements_en_attente' => Paiement::whereNull('cotisation_id')->where('statut', 'en_attente')->count(),
                'paiements_succes' => Paiement::whereNull('cotisation_id')->where('statut', 'succes')->count(),
                'total_encaisse' => Paiement::whereNull('cotisation_id')->where('statut', 'succes')->sum('montant'),
                'cotisations_non_soldees' => Cotisation::whereIn('statut', ['non_paye', 'partiel', 'en_retard'])->count(),
                'membres_a_risque_blocage' => $membresABloquerDefautPaiement->count(),
            ],
            'repartition_par_methode' => Paiement::select('methode_paiement', DB::raw('COUNT(*) as total'))
                ->whereNull('cotisation_id')
                ->where('statut', 'succes')
                ->groupBy('methode_paiement')
                ->get(),
            'actions_admin_recentes' => AdminAction::with(['admin', 'cibleUser'])->latest('date_action')->take(20)->get(),
            'paiements_recents' => Paiement::with(['user', 'cotisation'])
                ->whereNull('cotisation_id')
                ->latest()
                ->take(20)
                ->get(),
            'membres_en_attente' => User::whereIn('statut', ['en_attente', 'attente_adhesion'])->latest()->take(20)->get(),
            'membres_a_bloquer_defaut_paiement' => $membresABloquerDefautPaiement,
        ]);
    }
}
