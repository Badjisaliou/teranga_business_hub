<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ContactValidationService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const ADMIN_CREATION_CONFIRMATION = 'CREER ADMIN';

    public function __construct(
        private readonly UserService $userService,
        private readonly ContactValidationService $contactValidationService,
    ) {
    }

    public function register(Request $request): JsonResponse
    {
        $normalizedTelephone = $this->contactValidationService->normalizeSenegalPhone($request->input('telephone'));
        if ($normalizedTelephone !== null) {
            $request->merge(['telephone' => $normalizedTelephone]);
        }

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'telephone' => [
                'required',
                'string',
                'max:30',
                'unique:users,telephone',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$this->contactValidationService->isValidSenegalPhone(is_string($value) ? $value : null)) {
                        $fail('Le numero de telephone doit etre un numero mobile du Senegal valide.');
                    }
                },
            ],
            'numero_cni' => [
                'required',
                'string',
                'max:50',
                'unique:users,numero_cni',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$this->contactValidationService->isValidSenegalCni(is_string($value) ? $value : null)) {
                        $fail('Le numero CNI doit contenir entre 10 et 15 chiffres.');
                    }
                },
            ],
            'adresse' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'telephone_code' => ['nullable', 'string', 'size:6'],
            'registration_source' => ['nullable', 'string', 'in:admin_portal'],
            'admin_registration_secret' => ['nullable', 'string'],
            'confirmation_phrase' => ['nullable', 'string', 'max:50'],
        ]);

        $isAuthenticatedAdminRegistration = $request->user()?->role === 'admin';
        $isAdminPortalRegistration = ($validated['registration_source'] ?? null) === 'admin_portal'
            || $isAuthenticatedAdminRegistration;

        if ($isAdminPortalRegistration) {
            if (!$isAuthenticatedAdminRegistration) {
                $expectedSecret = (string) config('services.admin_portal.registration_secret', '');
                $providedSecret = (string) ($validated['admin_registration_secret'] ?? '');

                if ($expectedSecret === '' || !hash_equals($expectedSecret, $providedSecret)) {
                    return response()->json([
                        'message' => 'Cle secrete de creation admin invalide ou non configuree.',
                        'error_code' => 'admin_registration_secret_invalid',
                    ], 403);
                }
            }

            if ((string) ($validated['confirmation_phrase'] ?? '') !== self::ADMIN_CREATION_CONFIRMATION) {
                throw ValidationException::withMessages([
                    'confirmation_phrase' => ['Saisissez CREER ADMIN pour confirmer la creation administrateur.'],
                ]);
            }

            $validated['registration_source'] = 'admin_portal';
        } else {
            return response()->json([
                'message' => 'Le parcours inscription membre passe maintenant par /api/adhesion/start puis paiement adhesion.',
                'error_code' => 'member_registration_moved_to_adhesion',
            ], 410);
        }

        if (($validated['email'] ?? null) === '') {
            $validated['email'] = null;
        }
        unset($validated['telephone_code'], $validated['confirmation_phrase']);

        $user = $this->userService->register($validated);

        return response()->json(['message' => 'Inscription reussie', 'user' => $user], 201);
    }

    public function checkRegistrationData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'numero_cni' => ['nullable', 'string', 'max:50'],
        ]);

        if (
            !array_key_exists('email', $validated) &&
            !array_key_exists('telephone', $validated) &&
            !array_key_exists('numero_cni', $validated)
        ) {
            throw ValidationException::withMessages([
                'request' => ['Veuillez fournir au moins un champ a verifier.'],
            ]);
        }

        $email = array_key_exists('email', $validated) ? trim((string) $validated['email']) : null;
        if ($email === '') {
            $email = null;
        }
        $telephoneRaw = $validated['telephone'] ?? null;
        $telephone = is_string($telephoneRaw) ? $this->contactValidationService->normalizeSenegalPhone($telephoneRaw) : null;
        $numeroCni = array_key_exists('numero_cni', $validated) ? preg_replace('/\s+/', '', (string) $validated['numero_cni']) : null;

        $emailValid = $email !== null ? (bool) filter_var($email, FILTER_VALIDATE_EMAIL) : true;
        $telephoneValid = $telephoneRaw !== null ? $this->contactValidationService->isValidSenegalPhone((string) $telephoneRaw) : true;
        $cniValid = $numeroCni !== null ? $this->contactValidationService->isValidSenegalCni($numeroCni) : true;

        $emailExists = $email !== null && $emailValid ? User::where('email', $email)->exists() : false;
        $telephoneExists = $telephone !== null && $telephoneValid ? User::where('telephone', $telephone)->exists() : false;
        $cniExists = $numeroCni !== null && $cniValid ? User::where('numero_cni', $numeroCni)->exists() : false;

        return response()->json([
            'email' => [
                'provided' => $email !== null,
                'valid_format' => $emailValid,
                'exists' => $emailExists,
            ],
            'telephone' => [
                'provided' => $telephoneRaw !== null,
                'normalized' => $telephoneRaw !== null ? $telephone : null,
                'valid_format' => $telephoneValid,
                'exists' => $telephoneExists,
            ],
            'numero_cni' => [
                'provided' => $numeroCni !== null,
                'valid_format' => $cniValid,
                'exists' => $cniExists,
            ],
            'can_register' => (!$emailExists && !$telephoneExists && !$cniExists) && $emailValid && $telephoneValid && $cniValid,
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => ['required_without:email', 'string'],
            'email' => ['nullable', 'email'],
            'password' => ['required_without:pin', 'string'],
            'pin' => ['required_without:password', 'string', 'regex:/^[0-9]{6}$/'],
        ]);

        $identifier = (string) ($validated['identifier'] ?? $validated['email']);
        if (!filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            if ($this->contactValidationService->isValidSenegalPhone($identifier)) {
                $normalized = $this->contactValidationService->normalizeSenegalPhone($identifier);
                if ($normalized !== null) {
                    $identifier = $normalized;
                }
            }
        }

        $result = isset($validated['pin'])
            ? $this->userService->loginWithPin($identifier, (string) $validated['pin'])
            : $this->userService->login($identifier, (string) $validated['password']);

        $responsePayload = [
            'message' => 'Connexion reussie',
            'user' => $result['user'],
        ];
        if (!$request->hasHeader('X-TBH-Portal')) {
            $responsePayload['token'] = $result['token'];
        }

        return response()->json($responsePayload)
            ->cookie($this->authenticationCookie((string) $result['token'], (string) $result['user']->role));
    }

    public function forgotPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => ['required', 'string', 'max:120'],
        ]);

        return response()->json([
            'message' => 'Contactez l administration afin de verifier votre identite et recevoir un lien unique de reinitialisation PIN.',
        ]);
    }

    public function resetPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'pin' => ['required', 'string', 'regex:/^[0-9]{6}$/', 'confirmed'],
        ]);

        $updated = $this->userService->resetPinWithToken((string) $validated['token'], (string) $validated['pin']);

        return response()->json([
            'message' => 'PIN reinitialise avec succes.',
            'user' => [
                'id' => $updated->id,
                'matricule' => $updated->matricule,
                'nom' => $updated->nom,
                'prenom' => $updated->prenom,
                'telephone' => $updated->telephone,
                'statut' => $updated->statut,
                'pin_configured_at' => optional($updated->pin_configured_at)->toIso8601String(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->userService->logout($request->user());

        return response()->json([
            'message' => 'Deconnexion reussie',
        ])->withCookie(Cookie::forget(
            $request->user()->role === 'admin'
                ? (string) config('auth.admin_cookie_name', 'tbh_admin_session')
                : (string) config('auth.member_cookie_name', 'tbh_member_session'),
            '/',
            config('auth.api_cookie_domain') ?: null,
        ));
    }

    public function session(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    private function authenticationCookie(string $token, string $role): \Symfony\Component\HttpFoundation\Cookie
    {
        return Cookie::make(
            $role === 'admin'
                ? (string) config('auth.admin_cookie_name', 'tbh_admin_session')
                : (string) config('auth.member_cookie_name', 'tbh_member_session'),
            $token,
            (int) config('auth.api_token_ttl_minutes', 10080),
            '/',
            config('auth.api_cookie_domain') ?: null,
            (bool) config('auth.api_cookie_secure', false),
            true,
            false,
            (string) config('auth.api_cookie_same_site', 'lax'),
        );
    }

}
