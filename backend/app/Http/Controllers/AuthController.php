<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ContactValidationService;
use App\Services\UserService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const PASSWORD_RESET_TTL_MINUTES = 30;

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
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
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
                        $fail('Le numero CNI doit contenir exactement 13 chiffres.');
                    }
                },
            ],
            'adresse' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'registration_source' => ['nullable', 'string', 'in:admin_portal'],
            'admin_registration_secret' => ['nullable', 'string'],
        ]);

        if (($validated['registration_source'] ?? null) === 'admin_portal') {
            $expectedSecret = (string) config('services.admin_portal.registration_secret', '');
            $providedSecret = (string) ($validated['admin_registration_secret'] ?? '');

            if ($expectedSecret === '' || !hash_equals($expectedSecret, $providedSecret)) {
                abort(403, 'Invalid admin registration secret.');
            }
        }

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
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $result = $this->userService->login($validated['email'], $validated['password']);

        return response()->json([
            'message' => 'Connexion reussie',
            'token' => $result['token'],
            'user' => $result['user'],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->userService->logout($request->user());

        return response()->json([
            'message' => 'Deconnexion reussie',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['required', Rule::in(['email', 'telephone'])],
            'identifier' => ['required', 'string', 'max:255'],
        ]);

        $channel = (string) $validated['channel'];
        $identifier = trim((string) $validated['identifier']);

        $user = null;
        if ($channel === 'email') {
            $user = User::where('email', $identifier)->first();
        } else {
            $normalized = $this->contactValidationService->normalizeSenegalPhone($identifier);
            if ($normalized !== null) {
                $user = User::where('telephone', $normalized)->first();
            }
        }

        if ($user) {
            $plainToken = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($plainToken),
                    'created_at' => now(),
                ],
            );

            $response = [
                'message' => 'Si le compte existe, un token de reinitialisation a ete genere.',
            ];

            if (app()->environment(['local', 'testing'])) {
                $response['dev_reset_token'] = $plainToken;
                $response['email'] = $user->email;
            }

            return response()->json($response);
        }

        return response()->json([
            'message' => 'Si le compte existe, un token de reinitialisation a ete genere.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();
        if (!$record) {
            throw ValidationException::withMessages([
                'email' => ['Token de reinitialisation invalide ou expire.'],
            ]);
        }

        $createdAt = isset($record->created_at) ? Carbon::parse((string) $record->created_at) : null;
        if ($createdAt === null || $createdAt->lt(now()->subMinutes(self::PASSWORD_RESET_TTL_MINUTES))) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            throw ValidationException::withMessages([
                'token' => ['Token de reinitialisation invalide ou expire.'],
            ]);
        }

        if (!Hash::check($validated['token'], (string) $record->token)) {
            throw ValidationException::withMessages([
                'token' => ['Token de reinitialisation invalide ou expire.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            throw ValidationException::withMessages([
                'email' => ['Compte introuvable.'],
            ]);
        }

        $user->password = Hash::make($validated['password']);
        $user->api_token = null;
        $user->api_token_created_at = null;
        $user->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Mot de passe reinitialise avec succes.',
        ]);
    }
}
