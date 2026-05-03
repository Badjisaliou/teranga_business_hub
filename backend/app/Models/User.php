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
        'nom',
        'prenom',
        'email',
        'telephone',
        'numero_cni',
        'adresse',
        'password',
        'role',
        'statut',
        'photo_profil',
        'kyc_statut',
        'date_adhesion',
        'date_expiration',
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
            'date_adhesion' => 'datetime',
            'date_expiration' => 'datetime',
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
