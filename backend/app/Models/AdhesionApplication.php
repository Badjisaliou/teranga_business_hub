<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdhesionApplication extends Model
{
    protected $fillable = [
        'public_id',
        'civilite',
        'prenom',
        'nom',
        'date_naissance',
        'telephone',
        'email',
        'pays_residence',
        'region',
        'departement',
        'commune',
        'numero_cni',
        'pin_hash',
        'conditions_acceptees',
        'statut',
        'montant_adhesion',
        'payment_reference',
        'payment_method',
        'payment_channel',
        'checkout_url',
        'payment_expires_at',
        'failure_reason',
        'paid_at',
        'expires_at',
        'user_id',
    ];

    protected $hidden = ['pin_hash'];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
            'conditions_acceptees' => 'boolean',
            'montant_adhesion' => 'integer',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'payment_expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
