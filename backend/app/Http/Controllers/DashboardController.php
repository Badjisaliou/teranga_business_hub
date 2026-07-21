<?php

namespace App\Http\Controllers;

use App\Models\AdminAction;
use App\Models\AdhesionApplication;
use App\Models\Cotisation;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\User;
use App\Services\CotisationRiskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly CotisationRiskService $cotisationRiskService,
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
        $membresABloquerDefautPaiement = $this->cotisationRiskService->membersAtRisk();

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
            'adhesion_applications_non_finalisees' => AdhesionApplication::query()
                ->whereIn('statut', ['draft', 'payment_pending', 'failed'])
                ->latest()
                ->take(20)
                ->get(),
            'membres_a_bloquer_defaut_paiement' => $membresABloquerDefautPaiement,
        ]);
    }
}
