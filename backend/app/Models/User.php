<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'matricule',
        'civilite',
        'nom',
        'prenom',
        'date_naissance',
        'email',
        'telephone',
        'numero_cni',
        'adresse',
        'pays_residence',
        'region',
        'departement',
        'commune',
        'password',
        'pin_hash',
        'pin_configured_at',
        'pin_failed_attempts',
        'pin_locked_until',
        'pin_reset_token_hash',
        'pin_reset_token_expires_at',
        'pin_reset_token_created_at',
        'role',
        'statut',
        'date_adhesion',
        'date_expiration',
        'cotisation_montant_mensuel',
        'card_token',
        'card_issued_at',
        'api_token',
        'api_token_created_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'pin_hash',
        'remember_token',
        'api_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'date_naissance' => 'date',
            'date_adhesion' => 'datetime',
            'date_expiration' => 'datetime',
            'cotisation_montant_mensuel' => 'integer',
            'pin_configured_at' => 'datetime',
            'pin_locked_until' => 'datetime',
            'pin_reset_token_expires_at' => 'datetime',
            'pin_reset_token_created_at' => 'datetime',
            'card_issued_at' => 'datetime',
            'api_token_created_at' => 'datetime',
        ];
    }

    public function cotisations(): HasMany
    {
        return $this->hasMany(Cotisation::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function notificationsMetier(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
