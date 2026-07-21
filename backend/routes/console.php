<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use App\Services\AdhesionApplicationService;
use App\Services\CotisationRiskService;
use App\Services\DataRetentionService;
use App\Services\PaiementService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('cotisations:mark-overdue', function () {
    $updated = app(CotisationRiskService::class)->markOverdue();

    $this->info("Cotisations marquees en retard: {$updated}");
    Log::info('cotisations_mark_overdue_executed', [
        'updated_count' => $updated,
        'executed_at' => now()->toDateTimeString(),
    ]);
})->purpose('Passe les cotisations non payees/partielles en en_retard pour les mois anterieurs');

Schedule::command('cotisations:mark-overdue')->dailyAt('00:10');

Artisan::command('adhesion-applications:expire-stale', function () {
    $expired = app(AdhesionApplicationService::class)->expireStaleApplications();

    $this->info("Inscriptions adhesion expirees: {$expired}");
    Log::info('adhesion_applications_expire_stale_executed', [
        'expired_count' => $expired,
        'executed_at' => now()->toDateTimeString(),
    ]);
})->purpose('Expire les inscriptions adhesion non finalisees apres le delai configure');

Schedule::command('adhesion-applications:expire-stale')->hourly();

Artisan::command('payments:expire-stale', function () {
    $expired = app(PaiementService::class)->expireStaleTransactions();

    $this->info("Transactions de paiement expirees: {$expired}");
    Log::info('payments_expire_stale_executed', [
        'expired_count' => $expired,
        'executed_at' => now()->toDateTimeString(),
    ]);
})->purpose('Marque en echec les sessions DexPay abandonnees apres leur expiration');

Schedule::command('payments:expire-stale')->hourly()->withoutOverlapping();

Artisan::command('data:prune-expired', function () {
    $deleted = app(DataRetentionService::class)->prune();

    foreach ($deleted as $category => $count) {
        $this->info("{$category}: {$count}");
    }

    Log::info('data_prune_expired_executed', [
        ...$deleted,
        'executed_at' => now()->toDateTimeString(),
    ]);
})->purpose('Supprime les donnees techniques expirees et les adhesions abandonnees sans reference de paiement');

Schedule::command('data:prune-expired')->dailyAt('01:10')->withoutOverlapping();

Artisan::command('memberships:diagnose-payment-defaults {--notify : Notifie les membres a risque sans les bloquer}', function () {
    $service = app(CotisationRiskService::class);
    $updated = $service->markOverdue();
    $membersAtRisk = $service->membersAtRisk();
    $sent = $this->option('notify') ? $service->notifyMembersAtRisk() : 0;

    $this->info("Cotisations marquees en retard: {$updated}");
    $this->info("Membres a risque de blocage: {$membersAtRisk->count()}");
    if ($this->option('notify')) {
        $this->info("Notifications retard envoyees: {$sent}");
    }

    Log::info('memberships_diagnose_payment_defaults_executed', [
        'overdue_updated_count' => $updated,
        'members_at_risk_count' => $membersAtRisk->count(),
        'notifications_sent_count' => $sent,
        'executed_at' => now()->toDateTimeString(),
    ]);
})->purpose('Diagnostique les retards de cotisation et signale les membres a risque');

Schedule::command('memberships:diagnose-payment-defaults --notify')->dailyAt('00:20');

Artisan::command('memberships:auto-block-payment-default {--force : Confirme le blocage des membres a risque}', function () {
    if (!$this->option('force')) {
        $this->warn('Commande non executee. Ajoutez --force pour bloquer les membres a risque.');
        return 1;
    }

    $blocked = app(CotisationRiskService::class)->blockMembersAtRisk();

    $this->info("Comptes bloques: {$blocked}");
    Log::info('memberships_auto_block_payment_default_executed', [
        'blocked_count' => $blocked,
        'executed_at' => now()->toDateTimeString(),
    ]);

    return 0;
})->purpose('Bloque manuellement les membres actifs ayant atteint le seuil de mois non soldes');

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

Artisan::command('app:diagnose-readiness {--production : Active les controles stricts de production}', function () {
    $production = (bool) $this->option('production');
    $failures = 0;
    $warnings = 0;

    $check = function (string $label, bool $ok, string $message = '', bool $warning = false) use (&$failures, &$warnings): void {
        if ($ok) {
            $this->info("[OK] {$label}");
            return;
        }

        if ($warning) {
            $warnings++;
            $this->warn("[WARN] {$label}" . ($message !== '' ? " - {$message}" : ''));
            return;
        }

        $failures++;
        $this->error("[FAIL] {$label}" . ($message !== '' ? " - {$message}" : ''));
    };

    $appKey = (string) config('app.key');
    $appUrl = (string) config('app.url');
    $frontendUrl = (string) config('cors.allowed_origins.0', env('FRONTEND_URL'));
    $adminFrontendUrl = (string) config('cors.allowed_origins.1', env('ADMIN_FRONTEND_URL'));
    $corsAllowedOrigins = array_values(array_filter((array) config('cors.allowed_origins', [])));
    $corsHasUnsafeOrigin = collect($corsAllowedOrigins)->contains(function (string $origin): bool {
        return $origin === '*'
            || str_contains($origin, 'localhost')
            || str_contains($origin, '127.0.0.1')
            || str_contains($origin, '[::1]')
            || str_ends_with($origin, '/');
    });
    $logLevel = (string) env('LOG_LEVEL', config('logging.channels.single.level', 'debug'));
    $tokenTtlMinutes = (int) config('auth.api_token_ttl_minutes', 10080);
    $adhesionExpirationHours = (int) config('services.adhesion.application_expiration_hours', 24);
    $deploymentConfig = '';
    foreach ([base_path('Procfile'), base_path('railway.toml')] as $deploymentConfigPath) {
        if (is_file($deploymentConfigPath)) {
            $deploymentConfig .= "\n" . file_get_contents($deploymentConfigPath);
        }
    }
    $usesArtisanServeInDeployment = str_contains(strtolower($deploymentConfig), 'php artisan serve');

    $this->line('Diagnostic Teranga Business Hub');
    $this->line('Mode: ' . ($production ? 'production strict' : 'standard'));
    if (!$production) {
        $this->line('Controles stricts production ignores. Utilisez --production avant de deployer.');
    }

    $check('APP_KEY configure', $appKey !== '', 'APP_KEY est vide.');
    $check('APP_URL valide', filter_var($appUrl, FILTER_VALIDATE_URL) !== false, "APP_URL invalide: {$appUrl}");
    $check('FRONTEND_URL valide', filter_var($frontendUrl, FILTER_VALIDATE_URL) !== false, "FRONTEND_URL invalide: {$frontendUrl}");
    $check('ADMIN_FRONTEND_URL valide', filter_var($adminFrontendUrl, FILTER_VALIDATE_URL) !== false, "ADMIN_FRONTEND_URL invalide: {$adminFrontendUrl}");
    if ($production) {
        $check('APP_ENV production', config('app.env') === 'production', 'APP_ENV doit etre production.');
        $check('APP_DEBUG desactive en production', config('app.debug') === false, 'APP_DEBUG doit etre false en production.');
        $check('LOG_LEVEL non verbeux en production', !in_array(strtolower($logLevel), ['debug'], true), 'LOG_LEVEL ne doit pas etre debug en production.');
        $check('Base de donnees non SQLite en production', config('database.default') !== 'sqlite', 'DB_CONNECTION doit cibler PostgreSQL/MySQL, pas SQLite.');
        $check('Serveur web production robuste', !$usesArtisanServeInDeployment, 'Supprimez `php artisan serve` de Procfile/railway.toml et laissez Nixpacks servir public/ via PHP-FPM + Caddy.');
        $check('TTL token API borne', $tokenTtlMinutes > 0 && $tokenTtlMinutes <= 10080, 'API_TOKEN_TTL_MINUTES doit etre entre 1 et 10080.');
        $check('Expiration inscription adhesion bornee', $adhesionExpirationHours > 0 && $adhesionExpirationHours <= 168, 'ADHESION_APPLICATION_EXPIRATION_HOURS doit etre entre 1 et 168.');
        $check('Secret inscription admin configure', (string) config('services.admin_portal.registration_secret', '') !== '', 'ADMIN_PORTAL_REGISTRATION_SECRET est requis.');
        $check('URLs publiques HTTPS en production', (
            str_starts_with($appUrl, 'https://')
            && str_starts_with($frontendUrl, 'https://')
            && str_starts_with($adminFrontendUrl, 'https://')
        ), 'APP_URL, FRONTEND_URL et ADMIN_FRONTEND_URL doivent etre en HTTPS.');
        $check(
            'URLs publiques non generiques',
            !str_contains($appUrl, 'your-')
            && !str_contains($frontendUrl, 'your-')
            && !str_contains($adminFrontendUrl, 'your-'),
            'Remplacez les domaines exemples par les URLs Railway/Vercel finales.'
        );
        $check(
            'CORS limite aux frontends publics',
            count($corsAllowedOrigins) >= 2
            && count($corsAllowedOrigins) <= 6
            && in_array($frontendUrl, $corsAllowedOrigins, true)
            && in_array($adminFrontendUrl, $corsAllowedOrigins, true),
            'CORS doit contenir FRONTEND_URL, ADMIN_FRONTEND_URL et seulement les domaines publics explicites necessaires.'
        );
        $check(
            'CORS sans origine locale ou wildcard',
            !$corsHasUnsafeOrigin,
            'FRONTEND_URL et ADMIN_FRONTEND_URL ne doivent contenir ni localhost, ni 127.0.0.1, ni wildcard, ni slash final.'
        );
        $check(
            'Domaines frontend/admin distincts',
            $frontendUrl !== $adminFrontendUrl,
            'FRONTEND_URL et ADMIN_FRONTEND_URL doivent pointer vers deux domaines Vercel finaux distincts.'
        );
        $check(
            'Header export CSV expose en CORS',
            in_array('Content-Disposition', (array) config('cors.exposed_headers', []), true),
            'Content-Disposition doit etre expose pour nommer les exports CSV cross-origin.'
        );
        $check(
            'Scheduler Railway verifie manuellement',
            false,
            'Ajoutez un service Railway separe avec `php artisan schedule:work`, puis verifiez les logs des commandes planifiees.',
            true
        );
    }

    try {
        DB::connection()->getPdo();
        $check('Connexion base de donnees', true);
    } catch (Throwable $e) {
        $check('Connexion base de donnees', false, $e->getMessage());
    }

    try {
        $pendingMigrations = collect(DB::select('select migration from migrations'))->isEmpty()
            ? null
            : null;
        Artisan::call('migrate:status', ['--no-ansi' => true]);
        $statusOutput = Artisan::output();
        $hasPending = str_contains($statusOutput, '| Pending');
        $check('Migrations appliquees', !$hasPending, 'Certaines migrations sont en attente.');
        unset($pendingMigrations);
    } catch (Throwable $e) {
        $check('Statut migrations', false, $e->getMessage(), true);
    }

    $dexPayEnabled = (bool) config('services.dexpay.enabled', false);
    $dexPayMode = (string) config('services.dexpay.mode', 'sandbox');
    $dexPayKeysOk = config('services.dexpay.public_key') !== '';
    $dexPayWebhookSecretConfigured = (string) config('services.dexpay.webhook_secret', '') !== '';

    $check('Cles DexPay presentes si actif', !$dexPayEnabled || $dexPayKeysOk, 'Cle publique DexPay manquante.');
    $check('Secret webhook DexPay present si actif', !$dexPayEnabled || $dexPayWebhookSecretConfigured, 'DEXPAY_WEBHOOK_SECRET est requis pour confirmer les paiements.');
    if ($production) {
        $check('DexPay actif en production', $dexPayEnabled, 'DEXPAY_ENABLED doit etre true.');
        $check('DexPay mode live en production', $dexPayMode === 'live', 'DEXPAY_MODE doit etre live.');
        $check('Auto-confirm DexPay desactive en production', !(bool) config('services.dexpay.auto_confirm_dev', false), 'DEXPAY_AUTO_CONFIRM_DEV doit etre false.');
        $check('Mode mobile money dev desactive en production', config('services.mobile_money.mode') !== 'dev', 'MOBILE_MONEY_MODE ne doit pas etre dev.');
    }

    $webhookUrl = (string) config('services.dexpay.webhook_url');
    $successUrl = (string) config('services.dexpay.success_url');
    $failureUrl = (string) config('services.dexpay.failure_url');
    $check('DexPay webhook URL valide', filter_var($webhookUrl, FILTER_VALIDATE_URL) !== false, "URL invalide: {$webhookUrl}");
    $check('DexPay success URL valide', filter_var($successUrl, FILTER_VALIDATE_URL) !== false, "URL invalide: {$successUrl}");
    $check('DexPay failure URL valide', filter_var($failureUrl, FILTER_VALIDATE_URL) !== false, "URL invalide: {$failureUrl}");
    if ($production) {
        $check('URLs DexPay HTTPS en production', (
            str_starts_with($webhookUrl, 'https://')
            && str_starts_with($successUrl, 'https://')
            && str_starts_with($failureUrl, 'https://')
        ), 'DEXPAY_WEBHOOK_URL, DEXPAY_SUCCESS_URL et DEXPAY_FAILURE_URL doivent etre en HTTPS.');
    }

    $this->line("Resultat: {$failures} erreur(s), {$warnings} avertissement(s).");

    return $failures > 0 ? 1 : 0;
})->purpose('Diagnostique la configuration locale ou production avant un test/deploiement');
