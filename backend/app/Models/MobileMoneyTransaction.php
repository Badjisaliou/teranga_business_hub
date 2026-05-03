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
        'statut',
        'idempotency_key',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
