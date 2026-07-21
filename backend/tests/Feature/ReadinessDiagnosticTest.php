<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadinessDiagnosticTest extends TestCase
{
    use RefreshDatabase;

    public function test_production_diagnostic_fails_for_unsafe_environment(): void
    {
        config()->set('app.env', 'local');
        config()->set('app.debug', true);
        config()->set('app.key', 'base64:' . base64_encode(str_repeat('a', 32)));
        config()->set('app.url', 'http://your-backend-domain.up.railway.app');
        config()->set('database.default', 'sqlite');
        config()->set('cors.allowed_origins', [
            'http://localhost:3000',
            'https://your-admin-frontend.vercel.app',
            'https://unexpected.example.test',
        ]);
        config()->set('auth.api_token_ttl_minutes', 0);
        config()->set('services.admin_portal.registration_secret', '');
        config()->set('services.dexpay.enabled', false);
        config()->set('services.dexpay.mode', 'sandbox');
        config()->set('services.dexpay.webhook_url', 'http://backend.test/api/webhook/dexpay');
        config()->set('services.dexpay.success_url', 'http://frontend.test/paiement/retour');
        config()->set('services.dexpay.failure_url', 'http://frontend.test/paiement/annule');
        $this->artisan('app:diagnose-readiness --production')
            ->expectsOutputToContain('[FAIL] APP_ENV production')
            ->expectsOutputToContain('[FAIL] APP_DEBUG desactive en production')
            ->expectsOutputToContain('[FAIL] Base de donnees non SQLite en production')
            ->expectsOutputToContain('[FAIL] CORS sans origine locale ou wildcard')
            ->expectsOutputToContain('[FAIL] DexPay actif en production')
            ->expectsOutputToContain('[FAIL] URLs DexPay HTTPS en production')
            ->assertExitCode(1);
    }

    public function test_production_diagnostic_rejects_artisan_serve_deployment_command(): void
    {
        $procfile = base_path('Procfile');
        file_put_contents($procfile, 'web: php artisan serve --host=0.0.0.0 --port=$PORT');

        try {
            $this->artisan('app:diagnose-readiness --production')
                ->expectsOutputToContain('[FAIL] Serveur web production robuste')
                ->assertExitCode(1);
        } finally {
            if (is_file($procfile)) {
                unlink($procfile);
            }
        }
    }
}
