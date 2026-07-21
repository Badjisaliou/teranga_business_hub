<?php

namespace App\Http\Controllers;

use App\Models\AdminAction;
use App\Models\Cotisation;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\User;
use App\Services\AdminService;
use App\Services\UserService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    private const MEMBER_BLOCK_CONFIRMATION = 'BLOQUER';

    private const PIN_RESET_LINK_CONFIRMATION = 'RESET PIN';

    public function __construct(
        private readonly AdminService $adminService,
        private readonly UserService $userService,
    )
    {
    }

    public function blockUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
            'confirmation_phrase' => ['nullable', 'string', 'max:50'],
        ]);

        if ((string) ($validated['confirmation_phrase'] ?? '') !== self::MEMBER_BLOCK_CONFIRMATION) {
            throw ValidationException::withMessages([
                'confirmation_phrase' => ['Saisissez BLOQUER pour confirmer le blocage du membre.'],
            ]);
        }

        $admin = $request->user();

        $updated = $this->adminService->bloquerUtilisateur($admin, User::findOrFail($validated['user_id']), $validated['description'] ?? null);

        return response()->json(['message' => 'Membre bloque', 'user' => $updated]);
    }

    public function unblockUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
        ]);

        $admin = $request->user();

        $updated = $this->adminService->debloquerUtilisateur($admin, User::findOrFail($validated['user_id']), $validated['description'] ?? null);

        return response()->json(['message' => 'Membre debloque', 'user' => $updated]);
    }

    public function generatePinResetLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
            'confirmation_phrase' => ['nullable', 'string', 'max:50'],
        ]);

        if ((string) ($validated['confirmation_phrase'] ?? '') !== self::PIN_RESET_LINK_CONFIRMATION) {
            throw ValidationException::withMessages([
                'confirmation_phrase' => ['Saisissez RESET PIN pour confirmer la generation du lien.'],
            ]);
        }

        $member = User::findOrFail($validated['user_id']);
        if ($member->role !== 'membre') {
            throw ValidationException::withMessages([
                'user_id' => ['Le lien de reset PIN concerne uniquement les membres.'],
            ]);
        }

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        if (filter_var($frontendUrl, FILTER_VALIDATE_URL) === false) {
            throw ValidationException::withMessages([
                'frontend_url' => ['Le domaine public du portail membre est invalide ou non configure.'],
            ]);
        }

        $token = DB::transaction(function () use ($request, $member, $validated): array {
            $token = $this->userService->createPinResetToken($member);
            $this->adminService->journaliserLienResetPin(
                $request->user(),
                $member,
                $validated['description'] ?? 'Lien de reinitialisation PIN genere.'
            );

            return $token;
        });

        $resetUrl = $frontendUrl . '/reset-pin?token=' . urlencode($token['token']);

        return response()->json([
            'message' => 'Lien de reinitialisation PIN genere.',
            'reset_url' => $resetUrl,
            'expires_at' => $token['expires_at']->toIso8601String(),
        ]);
    }

    public function blockedUsers(): JsonResponse
    {
        $users = User::where('role', 'membre')
            ->where('statut', 'bloque')
            ->orderByDesc('updated_at')
            ->get(['id', 'matricule', 'nom', 'prenom', 'email', 'telephone', 'statut', 'updated_at']);

        return response()->json(['data' => $users]);
    }

    public function membres(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'statut' => ['nullable', 'string', 'in:actif,bloque'],
            'card_status' => ['nullable', 'string', 'in:valide,expiree,invalide'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::query()
            ->where('role', 'membre')
            ->whereIn('statut', ['actif', 'bloque']);

        if (!empty($validated['statut'])) {
            $query->where('statut', $validated['statut']);
        }

        if (!empty($validated['card_status'])) {
            $this->applyCardStatusFilter($query, (string) $validated['card_status']);
        }

        if (!empty($validated['q'])) {
            $needle = trim((string) $validated['q']);
            $query->where(function (Builder $builder) use ($needle): void {
                $builder
                    ->where('nom', 'like', "%{$needle}%")
                    ->orWhere('prenom', 'like', "%{$needle}%")
                    ->orWhere('email', 'like', "%{$needle}%")
                    ->orWhere('telephone', 'like', "%{$needle}%")
                    ->orWhere('matricule', 'like', "%{$needle}%");
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 15);
        $paginator = $query
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $stats = [
            'total_membres' => User::where('role', 'membre')->whereIn('statut', ['actif', 'bloque'])->count(),
            'actifs' => User::where('role', 'membre')->where('statut', 'actif')->count(),
            'bloques' => User::where('role', 'membre')->where('statut', 'bloque')->count(),
            'cartes_expirees' => User::where('role', 'membre')
                ->whereNotNull('date_expiration')
                ->where('date_expiration', '<', now())
                ->count(),
            'cartes_invalides' => User::where('role', 'membre')
                ->where(function (Builder $builder): void {
                    $builder
                        ->where('statut', 'bloque')
                        ->orWhereNull('card_token')
                        ->orWhereNull('date_expiration')
                        ->orWhere('date_expiration', '<', now());
                })
                ->count(),
        ];

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'stats' => $stats,
        ]);
    }

    private function applyCardStatusFilter(Builder $query, string $cardStatus): void
    {
        if ($cardStatus === 'valide') {
            $query
                ->where('statut', 'actif')
                ->whereNotNull('card_token')
                ->whereNotNull('date_expiration')
                ->where('date_expiration', '>=', now());
            return;
        }

        if ($cardStatus === 'expiree') {
            $query
                ->whereNotNull('date_expiration')
                ->where('date_expiration', '<', now());
            return;
        }

        $query->where(function (Builder $builder): void {
            $builder
                ->where('statut', 'bloque')
                ->orWhereNull('card_token')
                ->orWhereNull('date_expiration')
                ->orWhere('date_expiration', '<', now());
        });
    }

    public function showMember(User $user): JsonResponse
    {
        if ($user->role !== 'membre') {
            abort(404);
        }

        $cotisations = Cotisation::query()
            ->where('user_id', $user->id)
            ->with(['paiements' => function ($query) {
                $query->orderByDesc('date_paiement')
                    ->orderByDesc('created_at');
            }])
            ->orderByDesc('annee')
            ->orderByDesc('mois')
            ->get();

        $paiements = Paiement::query()
            ->where('user_id', $user->id)
            ->whereNull('cotisation_id')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('date_envoi')
            ->orderByDesc('id')
            ->limit(20)
            ->get();

        $adminActions = AdminAction::query()
            ->with('admin:id,nom,prenom,email')
            ->where('cible_user_id', $user->id)
            ->orderByDesc('date_action')
            ->limit(20)
            ->get();

        return response()->json([
            'user' => $user,
            'summary' => [
                'total_paiements_succes' => Paiement::where('user_id', $user->id)
                    ->whereNull('cotisation_id')
                    ->where('statut', 'succes')
                    ->sum('montant'),
                'cotisations_a_jour' => Cotisation::where('user_id', $user->id)->where('statut', 'a_jour')->count(),
                'cotisations_non_soldees' => Cotisation::where('user_id', $user->id)->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])->count(),
                'notifications_non_lues' => Notification::where('user_id', $user->id)->where('statut', 'non_lu')->count(),
            ],
            'cotisations' => $cotisations,
            'paiements' => $paiements,
            'notifications' => $notifications,
            'admin_actions' => $adminActions,
        ]);
    }

    public function adminActions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'action' => ['nullable', 'string', 'in:blocage,deblocage,relance_paiement,pin_reset_link'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AdminAction::query()
            ->with([
                'admin:id,matricule,nom,prenom,email,telephone',
                'cibleUser:id,matricule,nom,prenom,email,telephone,statut',
            ]);

        if (!empty($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        if (!empty($validated['q'])) {
            $needle = trim((string) $validated['q']);
            $query->where(function (Builder $builder) use ($needle): void {
                $builder
                    ->where('description', 'like', "%{$needle}%")
                    ->orWhereHas('admin', function (Builder $relation) use ($needle): void {
                        $relation
                            ->where('nom', 'like', "%{$needle}%")
                            ->orWhere('prenom', 'like', "%{$needle}%")
                            ->orWhere('email', 'like', "%{$needle}%")
                            ->orWhere('telephone', 'like', "%{$needle}%")
                            ->orWhere('matricule', 'like', "%{$needle}%");
                    })
                    ->orWhereHas('cibleUser', function (Builder $relation) use ($needle): void {
                        $relation
                            ->where('nom', 'like', "%{$needle}%")
                            ->orWhere('prenom', 'like', "%{$needle}%")
                            ->orWhere('email', 'like', "%{$needle}%")
                            ->orWhere('telephone', 'like', "%{$needle}%")
                            ->orWhere('matricule', 'like', "%{$needle}%");
                    });
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 20);
        $paginator = $query
            ->orderByDesc('date_action')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'summary' => [
                'total_actions' => AdminAction::count(),
                'blocages' => AdminAction::where('action', 'blocage')->count(),
                'deblocages' => AdminAction::where('action', 'deblocage')->count(),
                'relances_paiement' => AdminAction::where('action', 'relance_paiement')->count(),
                'liens_reset_pin' => AdminAction::where('action', 'pin_reset_link')->count(),
            ],
        ]);
    }
}
