<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class AdminPortalRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_portal_registration_creates_active_admin(): void
    {
        Config::set('services.admin_portal.registration_secret', 'secret-admin');

        $response = $this->postJson('/api/register', [
            'nom' => 'Admin',
            'prenom' => 'Awa',
            'email' => 'admin@example.com',
            'telephone' => '771234567',
            'numero_cni' => '1234567890123',
            'password' => 'password123',
            'registration_source' => 'admin_portal',
            'admin_registration_secret' => 'secret-admin',
            'confirmation_phrase' => 'CREER ADMIN',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.statut', 'actif')
            ->assertJsonPath('user.email', 'admin@example.com');

        $admin = User::where('email', 'admin@example.com')->firstOrFail();

        $this->assertSame('admin', $admin->role);
        $this->assertSame('actif', $admin->statut);
        $this->assertNotNull($admin->date_adhesion);
        $this->assertNotNull($admin->date_expiration);
    }

    public function test_admin_portal_registration_rejects_invalid_secret(): void
    {
        Config::set('services.admin_portal.registration_secret', 'secret-admin');

        $response = $this->postJson('/api/register', [
            'nom' => 'Admin',
            'prenom' => 'Awa',
            'email' => 'admin@example.com',
            'telephone' => '771234567',
            'numero_cni' => '1234567890123',
            'password' => 'password123',
            'registration_source' => 'admin_portal',
            'admin_registration_secret' => 'wrong-secret',
            'confirmation_phrase' => 'CREER ADMIN',
        ]);

        $response
            ->assertForbidden()
            ->assertJsonPath('error_code', 'admin_registration_secret_invalid');

        $this->assertDatabaseMissing('users', [
            'email' => 'admin@example.com',
        ]);
    }

    public function test_admin_portal_registration_requires_confirmation_phrase(): void
    {
        Config::set('services.admin_portal.registration_secret', 'secret-admin');

        $response = $this->postJson('/api/register', [
            'nom' => 'Admin',
            'prenom' => 'Awa',
            'email' => 'admin@example.com',
            'telephone' => '771234567',
            'numero_cni' => '1234567890123',
            'password' => 'password123',
            'registration_source' => 'admin_portal',
            'admin_registration_secret' => 'secret-admin',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('confirmation_phrase');

        $this->assertDatabaseMissing('users', [
            'email' => 'admin@example.com',
        ]);
    }

    public function test_authenticated_admin_can_create_another_admin_without_bootstrap_secret(): void
    {
        Config::set('services.admin_portal.registration_secret', 'secret-admin');

        $admin = User::factory()->admin()->active()->create();
        $token = 'admin-token';
        $admin->forceFill([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ])->save();

        $response = $this
            ->withToken($token)
            ->postJson('/api/admin/register', [
                'nom' => 'Admin',
                'prenom' => 'Second',
                'email' => 'second-admin@example.com',
                'telephone' => '771234568',
                'numero_cni' => '1234567890124',
                'password' => 'password123',
                'confirmation_phrase' => 'CREER ADMIN',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.statut', 'actif');
    }
}
