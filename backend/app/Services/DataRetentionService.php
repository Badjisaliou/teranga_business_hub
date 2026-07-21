<?php

namespace App\Services;

use App\Models\AdhesionApplication;
use Illuminate\Support\Facades\DB;

class DataRetentionService
{
    /**
     * @return array{sessions: int, cache: int, cache_locks: int, paid_pin_hashes: int, abandoned_adhesions: int}
     */
    public function prune(): array
    {
        $now = now();
        $sessionLifetime = max(1, (int) config('session.lifetime', 120));
        $abandonedRetentionDays = max(1, (int) config('services.adhesion.abandoned_retention_days', 30));

        return [
            'sessions' => DB::table('sessions')->where('last_activity', '<', $now->copy()->subMinutes($sessionLifetime)->timestamp)->delete(),
            'cache' => DB::table('cache')->where('expiration', '<', $now->timestamp)->delete(),
            'cache_locks' => DB::table('cache_locks')->where('expiration', '<', $now->timestamp)->delete(),
            'paid_pin_hashes' => AdhesionApplication::query()
                ->where('statut', 'paid')
                ->whereNotNull('pin_hash')
                ->update(['pin_hash' => null, 'updated_at' => $now]),
            'abandoned_adhesions' => AdhesionApplication::query()
                ->where('statut', 'expired')
                ->whereNull('payment_reference')
                ->where('updated_at', '<', $now->copy()->subDays($abandonedRetentionDays))
                ->delete(),
        ];
    }
}
