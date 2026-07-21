<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    protected $fillable = [
        'user_id',
        'cotisation_id',
        'type',
        'montant',
        'reference',
        'methode_paiement',
        'canal_paiement',
        'statut',
        'failure_reason',
        'date_paiement',
        'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'date_paiement' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cotisation(): BelongsTo
    {
        return $this->belongsTo(Cotisation::class);
    }
}
