<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('cotisations:mark-overdue', function () {
    $now = now();
    $currentMonth = (int) $now->format('n');
    $currentYear = (int) $now->format('Y');

    $updated = DB::table('cotisations')
        ->whereIn('statut', ['non_paye', 'partiel'])
        ->where(function ($query) use ($currentMonth, $currentYear) {
            $query->where('annee', '<', $currentYear)
                ->orWhere(function ($q) use ($currentMonth, $currentYear) {
                    $q->where('annee', '=', $currentYear)
                        ->where('mois', '<', $currentMonth);
                });
        })
        ->update(['statut' => 'en_retard', 'updated_at' => $now]);

    $this->info("Cotisations marquees en retard: {$updated}");
    Log::info('cotisations_mark_overdue_executed', [
        'updated_count' => $updated,
        'executed_at' => $now->toDateTimeString(),
    ]);
})->purpose('Passe les cotisations non payees/partielles en en_retard pour les mois anterieurs');

Schedule::command('cotisations:mark-overdue')->dailyAt('00:10');

Artisan::command('memberships:auto-block-payment-default', function () {
    $now = now();
    $currentMonth = (int) $now->format('n');
    $currentYear = (int) $now->format('Y');
    $threshold = (int) DB::table('business_settings')
        ->where('key', '=', 'auto_block_unsold_months_threshold')
        ->value('value');
    if ($threshold <= 0) {
        $threshold = 2;
    }

    $riskSubquery = DB::table('cotisations')
        ->select('user_id', DB::raw('COUNT(*) as nb_non_soldes'))
        ->whereIn('statut', ['non_paye', 'partiel', 'en_retard'])
        ->where(function ($query) use ($currentMonth, $currentYear) {
            $query->where('annee', '<', $currentYear)
                ->orWhere(function ($q) use ($currentMonth, $currentYear) {
                    $q->where('annee', '=', $currentYear)
                        ->where('mois', '<', $currentMonth);
                });
        })
        ->groupBy('user_id')
        ->havingRaw('COUNT(*) >= ?', [$threshold]);

    $targets = DB::table('users')
        ->joinSub($riskSubquery, 'risk', function ($join) {
            $join->on('users.id', '=', 'risk.user_id');
        })
        ->where('users.statut', '=', 'actif')
        ->where('users.role', '=', 'membre')
        ->get(['users.id', 'risk.nb_non_soldes']);

    $blocked = 0;
    foreach ($targets as $target) {
        DB::table('users')
            ->where('id', '=', $target->id)
            ->update([
                'statut' => 'bloque',
                'api_token' => null,
                'api_token_created_at' => null,
                'updated_at' => $now,
            ]);

        DB::table('notifications')->insert([
            'user_id' => $target->id,
            'message' => "Votre compte est bloque pour defaut de paiement (au moins {$threshold} mois non soldes). Merci de contacter la structure Teranga Business Hub.",
            'type' => 'retard',
            'statut' => 'non_lu',
            'date_envoi' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $blocked++;
    }

    $this->info("Comptes bloques automatiquement: {$blocked}");
    Log::info('memberships_auto_block_payment_default_executed', [
        'blocked_count' => $blocked,
        'targeted_count' => count($targets),
        'executed_at' => $now->toDateTimeString(),
    ]);
})->purpose('Bloque automatiquement les membres actifs ayant au moins 2 mois anterieurs non soldes');

Schedule::command('memberships:auto-block-payment-default')->dailyAt('00:20');

Artisan::command('memberships:notify-expiration', function () {
    $today = Carbon::today();
    $limitDate = Carbon::today()->addDays(30);
    $sent = 0;

    $users = DB::table('users')
        ->where('statut', '=', 'actif')
        ->whereNotNull('date_expiration')
        ->whereDate('date_expiration', '<=', $limitDate->toDateString())
        ->get(['id', 'date_expiration']);

    foreach ($users as $user) {
        $expiration = Carbon::parse($user->date_expiration);
        $daysLeft = (int) $today->diffInDays($expiration, false);

        $message = $daysLeft < 0
            ? 'Votre adhesion est expiree. Veuillez proceder au renouvellement.'
            : "Votre adhesion expire dans {$daysLeft} jour(s).";

        $alreadyNotifiedToday = DB::table('notifications')
            ->where('user_id', '=', $user->id)
            ->where('type', '=', 'expiration')
            ->whereDate('date_envoi', '=', $today->toDateString())
            ->exists();

        if ($alreadyNotifiedToday) {
            continue;
        }

        DB::table('notifications')->insert([
            'user_id' => $user->id,
            'message' => $message,
            'type' => 'expiration',
            'statut' => 'non_lu',
            'date_envoi' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sent++;
    }

    $this->info("Notifications expiration envoyees: {$sent}");
    Log::info('memberships_notify_expiration_executed', [
        'sent_count' => $sent,
        'checked_users' => count($users),
        'executed_at' => now()->toDateTimeString(),
    ]);
})->purpose('Envoie les notifications d expiration (J-30 et moins, ou deja expire)');

Schedule::command('memberships:notify-expiration')->dailyAt('08:00');
