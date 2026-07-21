<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MobileMoneyTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'montant',
        'reference',
        'methode_paiement',
        'canal_paiement',
        'statut',
        'failure_reason',
        'idempotency_key',
        'checkout_url',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
