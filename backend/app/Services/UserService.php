<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserService
{
    public function __construct(
        private readonly CotisationService $cotisationService,
    ) {
    }

    public function register(array $payload): User
    {
        $isAdminPortalRegistration = ($payload['registration_source'] ?? null) === 'admin_portal';

        unset($payload['registration_source']);
        unset($payload['admin_registration_secret']);

        $payload['matricule'] = $this->genererMatricule();
        $payload['role'] = $isAdminPortalRegistration ? 'admin' : 'membre';
        $payload['statut'] = $isAdminPortalRegistration ? 'actif' : 'en_attente';
        $payload['kyc_statut'] = 'incomplet';
        $payload['date_adhesion'] = $isAdminPortalRegistration ? now() : null;
        $payload['date_expiration'] = $isAdminPortalRegistration ? now()->addYear() : null;
        $payload['password'] = Hash::make($payload['password']);

        return User::create($payload);
    }

    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants invalides.'],
            ]);
        }

        if ($user->statut === 'rejete') {
            throw ValidationException::withMessages([
                'email' => ['Votre inscription n est pas acceptee. Merci de contacter la structure Teranga Business Hub pour plus d informations.'],
            ]);
        }

        if ($user->statut === 'bloque') {
            throw ValidationException::withMessages([
                'email' => ['Votre compte est bloque pour defaut de paiement. Merci de contacter la structure Teranga Business Hub pour plus d informations.'],
            ]);
        }

        $plainToken = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->api_token_created_at = now();
        $user->save();

        return [
            'user' => $user,
            'token' => $plainToken,
        ];
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

    public function uploadKYC(User $user, array $payload): User
    {
        if (array_key_exists('photo_profil', $payload)) {
            $user->photo_profil = $payload['photo_profil'];
        }

        $user->kyc_statut = $user->photo_profil ? 'complet' : 'incomplet';

        $user->save();

        return $user->refresh();
    }

    public function activerCompte(User $user): User
    {
        $user->statut = 'actif';
        $user->date_adhesion = now();
        $user->date_expiration = now()->addYear();
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
}
