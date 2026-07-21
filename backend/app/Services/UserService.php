<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserService
{
    private const PIN_RESET_TOKEN_TTL_MINUTES = 60;
    private const MAX_PIN_ATTEMPTS = 5;
    private const PIN_LOCK_MINUTES = 15;

    public function __construct(
        private readonly CotisationService $cotisationService,
        private readonly PinSecurityService $pinSecurityService,
    ) {
    }

    public function register(array $payload): User
    {
        $isAdminPortalRegistration = ($payload['registration_source'] ?? null) === 'admin_portal';

        unset($payload['registration_source']);
        unset($payload['admin_registration_secret']);

        $payload['matricule'] = $this->genererMatricule();
        $payload['role'] = $isAdminPortalRegistration ? 'admin' : 'membre';
        $payload['statut'] = 'actif';
        $payload['date_adhesion'] = $isAdminPortalRegistration ? now() : null;
        $payload['date_expiration'] = $isAdminPortalRegistration ? now()->addYear() : null;
        $payload['password'] = Hash::make($payload['password']);

        return User::create($payload);
    }

    public function login(string $identifier, string $password): array
    {
        $identifier = trim($identifier);
        $user = $this->findByIdentifier($identifier);

        if (!$user || $user->role !== 'admin' || !$user->password || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['Identifiants invalides.'],
            ]);
        }

        $this->guardCanAuthenticate($user);

        return $this->issueApiToken($user);
    }

    /**
     * @return array{user: User, token: string}
     */
    public function loginWithPin(string $identifier, string $pin): array
    {
        $user = $this->findByIdentifier($identifier);

        if (!$user || !$user->pin_hash || !$user->pin_configured_at) {
            throw ValidationException::withMessages([
                'identifier' => ['Identifiants invalides.'],
            ]);
        }

        $this->guardCanAuthenticate($user);
        $this->guardPinNotLocked($user);

        if (!Hash::check($pin, $user->pin_hash)) {
            $this->recordFailedPinAttempt($user);
            throw ValidationException::withMessages([
                'identifier' => ['Identifiants invalides.'],
            ]);
        }

        $user->pin_failed_attempts = 0;
        $user->pin_locked_until = null;
        $user->save();

        return $this->issueApiToken($user);
    }

    public function resetPin(User $user, string $pin): User
    {
        $user->pin_hash = Hash::make($pin);
        $user->pin_configured_at = now();
        $user->pin_reset_token_hash = null;
        $user->pin_reset_token_expires_at = null;
        $user->pin_reset_token_created_at = null;
        $user->pin_failed_attempts = 0;
        $user->pin_locked_until = null;
        $user->api_token = null;
        $user->api_token_created_at = null;
        $user->save();

        return $user->refresh();
    }

    /**
     * @return array{token: string, expires_at: \Illuminate\Support\Carbon}
     */
    public function createPinResetToken(User $user): array
    {
        $plainToken = Str::random(72);
        $expiresAt = now()->addMinutes(self::PIN_RESET_TOKEN_TTL_MINUTES);

        $user->pin_reset_token_hash = hash('sha256', $plainToken);
        $user->pin_reset_token_expires_at = $expiresAt;
        $user->pin_reset_token_created_at = now();
        $user->pin_failed_attempts = 0;
        $user->pin_locked_until = null;
        $user->save();

        return [
            'token' => $plainToken,
            'expires_at' => $expiresAt,
        ];
    }

    public function resetPinWithToken(string $plainToken, string $pin): User
    {
        $tokenHash = hash('sha256', $plainToken);
        $user = User::where('pin_reset_token_hash', $tokenHash)->first();

        if (
            !$user
            || !$user->pin_reset_token_expires_at
            || $user->pin_reset_token_expires_at->isPast()
        ) {
            throw ValidationException::withMessages([
                'token' => ['Lien de reinitialisation PIN invalide ou expire.'],
            ]);
        }

        $this->pinSecurityService->assertStrong($pin, $user);

        return $this->resetPin($user, $pin);
    }

    /**
     * @return array{user: User, token: string}
     */
    private function issueApiToken(User $user): array
    {
        $plainToken = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->api_token_created_at = now();
        $user->save();

        return [
            'user' => $user,
            'token' => $plainToken,
        ];
    }

    public function findByIdentifier(string $identifier): ?User
    {
        $identifier = trim($identifier);

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $identifier)->first();
        }

        $digits = preg_replace('/\D+/', '', $identifier) ?? '';
        if ($digits !== '') {
            if (str_starts_with($digits, '221') && strlen($digits) === 12) {
                $digits = substr($digits, 3);
            }

            if (preg_match('/^7[05678][0-9]{7}$/', $digits)) {
                return User::where('telephone', $digits)->first();
            }
        }

        return User::where('matricule', $identifier)->first();
    }

    private function guardCanAuthenticate(?User $user): void
    {
        if (!$user) {
            throw ValidationException::withMessages([
                'identifier' => ['Identifiants invalides.'],
            ]);
        }

        if ($user->statut === 'bloque') {
            throw new HttpResponseException(response()->json([
                'message' => 'Votre espace membre est bloque pour defaut de paiement. Merci de contacter la structure Teranga Business Hub pour plus d informations.',
                'error_code' => 'account_blocked',
            ], 403));
        }
    }

    private function guardPinNotLocked(User $user): void
    {
        if ($user->pin_locked_until && $user->pin_locked_until->isFuture()) {
            throw ValidationException::withMessages([
                'identifier' => ['Trop de tentatives PIN. Reessayez plus tard.'],
            ]);
        }
    }

    private function recordFailedPinAttempt(User $user): void
    {
        $attempts = ((int) $user->pin_failed_attempts) + 1;
        $user->pin_failed_attempts = $attempts;

        if ($attempts >= self::MAX_PIN_ATTEMPTS) {
            $user->pin_locked_until = now()->addMinutes(self::PIN_LOCK_MINUTES);
        }

        $user->save();
    }

    public function logout(User $user): void
    {
        $user->api_token = null;
        $user->api_token_created_at = null;
        $user->save();
    }

    public function updateProfile(User $user, array $payload): User
    {
        $user->fill($payload);
        $user->save();

        return $user->refresh();
    }

    public function activerCompte(User $user): User
    {
        $user->statut = 'actif';
        $user->date_adhesion = now();
        $user->date_expiration = now()->addYear();
        if (!$user->card_token) {
            $user->card_token = $this->genererCardToken();
            $user->card_issued_at = now();
        }
        $user->save();

        if (!$user->cotisations()->exists()) {
            $this->cotisationService->creerEcheancierAnnuelDepuisMoisCourant($user, now());
        }

        return $user->refresh();
    }

    private function genererMatricule(): string
    {
        do {
            $matricule = 'TBH' . now()->format('ymd') . random_int(1000, 9999);
        } while (User::where('matricule', $matricule)->exists());

        return $matricule;
    }

    private function genererCardToken(): string
    {
        do {
            $token = Str::random(64);
        } while (User::where('card_token', $token)->exists());

        return $token;
    }
}
