<?php

namespace App\Http\Controllers;

use App\Services\ContactValidationService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
        private readonly ContactValidationService $contactValidationService,
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['user' => $user]);
    }

    public function update(Request $request): JsonResponse
    {
        if ($request->has('telephone')) {
            $normalizedTelephone = $this->contactValidationService->normalizeSenegalPhone($request->input('telephone'));
            if ($normalizedTelephone !== null) {
                $request->merge(['telephone' => $normalizedTelephone]);
            }
        }

        $validated = $request->validate([
            'civilite' => ['sometimes', 'nullable', 'string', 'max:20'],
            'nom' => ['sometimes', 'string', 'max:255'],
            'prenom' => ['sometimes', 'string', 'max:255'],
            'date_naissance' => ['sometimes', 'nullable', 'date', 'before:today'],
            'telephone' => [
                'sometimes',
                'string',
                'max:30',
                Rule::unique('users', 'telephone')->ignore($request->user()->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$this->contactValidationService->isValidSenegalPhone(is_string($value) ? $value : null)) {
                        $fail('Le numero de telephone doit etre un numero mobile du Senegal valide.');
                    }
                },
            ],
            'numero_cni' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('users', 'numero_cni')->ignore($request->user()->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$this->contactValidationService->isValidSenegalCni(is_string($value) ? $value : null)) {
                        $fail('Le numero CNI doit contenir entre 10 et 15 chiffres.');
                    }
                },
            ],
            'adresse' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pays_residence' => ['sometimes', 'nullable', 'string', 'max:255'],
            'region' => ['sometimes', 'nullable', 'string', 'max:255'],
            'departement' => ['sometimes', 'nullable', 'string', 'max:255'],
            'commune' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $updated = $this->userService->updateProfile($request->user(), $validated);

        return response()->json([
            'message' => 'Profil mis a jour',
            'user' => $updated,
        ]);
    }

    public function memberCard(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->statut !== 'actif') {
            throw ValidationException::withMessages([
                'user' => ['La carte membre est disponible uniquement pour les comptes actifs.'],
            ]);
        }

        if (!$user->card_token) {
            $user->card_token = $this->generateCardToken();
            $user->card_issued_at = now();
            $user->save();
            $user->refresh();
        }

        return response()->json([
            'card' => [
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'telephone' => $user->telephone,
                'adresse' => $user->adresse,
                'numero_cni' => $user->numero_cni,
                'statut' => $user->statut,
                'date_adhesion' => optional($user->date_adhesion)->toDateString(),
                'date_expiration' => optional($user->date_expiration)->toDateString(),
                'card_issued_at' => optional($user->card_issued_at)->toIso8601String(),
                'verification_url' => URL::to('/api/member-card/verify/' . $user->card_token),
                'is_valid' => $user->date_expiration ? now()->lessThanOrEqualTo($user->date_expiration) : false,
            ],
        ]);
    }

    public function verifyMemberCard(string $token): JsonResponse
    {
        $user = \App\Models\User::where('card_token', $token)->firstOrFail();
        $isExpired = $user->date_expiration ? now()->greaterThan($user->date_expiration) : true;
        $isValid = $user->statut === 'actif' && !$isExpired;

        return response()->json([
            'valid' => $isValid,
            'reason' => match (true) {
                $user->statut === 'bloque' => 'account_blocked',
                $isExpired => 'card_expired',
                default => null,
            },
            'card' => [
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'statut' => $user->statut,
                'date_expiration' => optional($user->date_expiration)->toDateString(),
                'card_issued_at' => optional($user->card_issued_at)->toIso8601String(),
            ],
        ]);
    }

    private function generateCardToken(): string
    {
        do {
            $token = Str::random(64);
        } while (\App\Models\User::where('card_token', $token)->exists());

        return $token;
    }
}
