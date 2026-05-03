<?php

namespace App\Http\Controllers;

use App\Services\ContactValidationService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        return response()->json([
            'user' => [
                ...$user->toArray(),
                'photo_profil_url' => $user->photo_profil ? Storage::disk('public')->url($user->photo_profil) : null,
            ],
        ]);
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
            'nom' => ['sometimes', 'string', 'max:255'],
            'prenom' => ['sometimes', 'string', 'max:255'],
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
                        $fail('Le numero CNI doit contenir exactement 13 chiffres.');
                    }
                },
            ],
            'adresse' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $updated = $this->userService->updateProfile($request->user(), $validated);

        return response()->json([
            'message' => 'Profil mis a jour',
            'user' => $updated,
        ]);
    }

    public function uploadKyc(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'photo_profil' => ['sometimes', 'nullable', 'file', 'image', 'max:5120'],
        ]);

        $payload = [];
        if (isset($validated['photo_profil'])) {
            if ($request->user()->photo_profil) {
                Storage::disk('public')->delete($request->user()->photo_profil);
            }
            $payload['photo_profil'] = $validated['photo_profil']->store('kyc/photo_profil', 'public');
        }
        $updated = $this->userService->uploadKYC($request->user(), $payload);

        return response()->json([
            'message' => 'KYC mis a jour',
            'user' => [
                ...$updated->toArray(),
                'photo_profil_url' => $updated->photo_profil ? Storage::disk('public')->url($updated->photo_profil) : null,
            ],
        ]);
    }

    public function deleteKycDocument(Request $request, string $document): JsonResponse
    {
        if ($document !== 'photo_profil') {
            throw ValidationException::withMessages([
                'document' => ['Document KYC non supporte.'],
            ]);
        }

        $user = $request->user();
        $currentPath = $user->{$document};
        if ($currentPath) {
            Storage::disk('public')->delete($currentPath);
        }

        $updated = $this->userService->uploadKYC($user, [$document => null]);

        return response()->json([
            'message' => 'Document KYC supprime',
            'user' => [
                ...$updated->toArray(),
                'photo_profil_url' => $updated->photo_profil ? Storage::disk('public')->url($updated->photo_profil) : null,
            ],
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
                'photo_profil' => $user->photo_profil,
                'photo_profil_url' => $user->photo_profil ? Storage::disk('public')->url($user->photo_profil) : null,
                'date_adhesion' => optional($user->date_adhesion)->toDateString(),
                'date_expiration' => optional($user->date_expiration)->toDateString(),
                'is_valid' => $user->date_expiration ? now()->lessThanOrEqualTo($user->date_expiration) : false,
            ],
        ]);
    }
}
