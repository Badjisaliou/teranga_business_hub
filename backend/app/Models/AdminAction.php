<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAction extends Model
{
    protected $fillable = [
        'admin_id',
        'cible_user_id',
        'action',
        'description',
        'date_action',
    ];

    protected function casts(): array
    {
        return [
            'date_action' => 'datetime',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function cibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cible_user_id');
    }
}

