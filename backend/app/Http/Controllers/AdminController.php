<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AdminService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(private readonly AdminService $adminService)
    {
    }

    public function validateUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
        ]);

        $admin = $request->user();

        $updated = $this->adminService->validerUtilisateur($admin, User::findOrFail($validated['user_id']), $validated['description'] ?? null);

        return response()->json(['message' => 'Utilisateur valide', 'user' => $updated]);
    }

    public function blockUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
        ]);

        $admin = $request->user();

        $updated = $this->adminService->bloquerUtilisateur($admin, User::findOrFail($validated['user_id']), $validated['description'] ?? null);

        return response()->json(['message' => 'Utilisateur bloque', 'user' => $updated]);
    }

    public function rejectUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
        ]);

        $admin = $request->user();

        $updated = $this->adminService->rejeterUtilisateur($admin, User::findOrFail($validated['user_id']), $validated['description'] ?? null);

        return response()->json(['message' => 'Utilisateur rejete', 'user' => $updated]);
    }

    public function unblockUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
        ]);

        $admin = $request->user();

        $updated = $this->adminService->debloquerUtilisateur($admin, User::findOrFail($validated['user_id']), $validated['description'] ?? null);

        return response()->json(['message' => 'Utilisateur debloque', 'user' => $updated]);
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
            'statut' => ['nullable', 'string', 'in:en_attente,attente_adhesion,actif,bloque,rejete'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::query()
            ->where('role', 'membre');

        if (!empty($validated['statut'])) {
            $query->where('statut', $validated['statut']);
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
            'total_membres' => User::where('role', 'membre')->count(),
            'actifs' => User::where('role', 'membre')->where('statut', 'actif')->count(),
            'en_attente' => User::where('role', 'membre')->where('statut', 'en_attente')->count(),
            'attente_adhesion' => User::where('role', 'membre')->where('statut', 'attente_adhesion')->count(),
            'bloques' => User::where('role', 'membre')->where('statut', 'bloque')->count(),
            'rejetes' => User::where('role', 'membre')->where('statut', 'rejete')->count(),
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
}
