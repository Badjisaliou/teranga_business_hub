<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PinAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_first_login_pin_setup_endpoints_are_removed(): void
    {
        $this->postJson('/api/auth/first-login/check', [
            'identifier' => 'TBH2607081234',
        ])->assertNotFound();

        $this->postJson('/api/auth/pin/setup', [
            'identifier' => 'TBH2607081234',
            'setup_token' => 'obsolete',
            'pin' => '123456',
            'pin_confirmation' => '123456',
        ])->assertNotFound();
    }

    public function test_member_can_login_with_phone_and_pin(): void
    {
        $user = User::factory()->active()->create([
            'telephone' => '771222222',
            'pin_hash' => Hash::make('654321'),
            'pin_configured_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'identifier' => '+221 77 122 22 22',
            'pin' => '654321',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token']);
    }

    public function test_pin_login_locks_after_repeated_failures(): void
    {
        $user = User::factory()->active()->create([
            'pin_hash' => Hash::make('123456'),
            'pin_configured_at' => now(),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'identifier' => $user->matricule,
                'pin' => '000000',
            ])->assertUnprocessable();
        }

        $user->refresh();
        $this->assertNotNull($user->pin_locked_until);

        $this->postJson('/api/login', [
            'identifier' => $user->matricule,
            'pin' => '123456',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('identifier');
    }

    public function test_blocked_member_pin_login_returns_account_blocked(): void
    {
        $user = User::factory()->active()->state(['statut' => 'bloque'])->create([
            'pin_hash' => Hash::make('123456'),
            'pin_configured_at' => now(),
        ]);

        $this->postJson('/api/login', [
            'identifier' => $user->matricule,
            'pin' => '123456',
        ])
            ->assertForbidden()
            ->assertJsonPath('error_code', 'account_blocked');
    }

    public function test_member_password_login_is_rejected(): void
    {
        $user = User::factory()->active()->create([
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'identifier' => $user->telephone,
            'password' => 'password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('identifier');
    }

    public function test_member_can_reset_pin_with_admin_generated_single_use_link(): void
    {
        config(['app.frontend_url' => 'https://membres.example.test']);

        $admin = User::factory()->admin()->create();
        $adminToken = 'admin-reset-token';
        $admin->update([
            'api_token' => hash('sha256', $adminToken),
            'api_token_created_at' => now(),
        ]);

        $user = User::factory()->active()->create([
            'matricule' => 'TBH2607085678',
            'telephone' => '771333333',
            'pin_hash' => Hash::make('111111'),
            'pin_configured_at' => now(),
            'pin_failed_attempts' => 5,
            'pin_locked_until' => now()->addMinutes(15),
            'api_token' => hash('sha256', 'old-token'),
            'api_token_created_at' => now(),
        ]);

        $forgotResponse = $this->postJson('/api/pin/forgot', [
            'identifier' => $user->matricule,
        ]);

        $forgotResponse
            ->assertOk()
            ->assertJsonMissingPath('identifier')
            ->assertJsonMissingPath('dev_reset_token');

        $unknownForgotResponse = $this->postJson('/api/pin/forgot', [
            'identifier' => 'TBH-INCONNU',
        ]);

        $unknownForgotResponse
            ->assertOk()
            ->assertExactJson($forgotResponse->json());

        $linkResponse = $this
            ->withToken($adminToken)
            ->postJson('/api/admin/pin-reset-link', [
                'user_id' => $user->id,
                'confirmation_phrase' => 'RESET PIN',
            ]);

        $linkResponse
            ->assertOk()
            ->assertJsonStructure(['reset_url', 'expires_at']);

        $resetUrl = (string) $linkResponse->json('reset_url');
        $this->assertStringStartsWith('https://membres.example.test/reset-pin?token=', $resetUrl);
        parse_str((string) parse_url($resetUrl, PHP_URL_QUERY), $query);
        $this->assertIsString($query['token'] ?? null);

        $resetResponse = $this->postJson('/api/pin/reset', [
            'token' => $query['token'],
            'pin' => '482951',
            'pin_confirmation' => '482951',
        ]);

        $resetResponse
            ->assertOk()
            ->assertJsonPath('user.matricule', $user->matricule);

        $user->refresh();
        $this->assertTrue(Hash::check('482951', (string) $user->pin_hash));
        $this->assertSame(0, (int) $user->pin_failed_attempts);
        $this->assertNull($user->pin_locked_until);
        $this->assertNull($user->pin_reset_token_hash);
        $this->assertNull($user->api_token);

        $this->postJson('/api/pin/reset', [
            'token' => $query['token'],
            'pin' => '730418',
            'pin_confirmation' => '730418',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');

        $this->postJson('/api/login', [
            'identifier' => $user->matricule,
            'pin' => '482951',
        ])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_blocked_member_can_change_pin_without_being_unblocked(): void
    {
        config(['app.frontend_url' => 'https://membres.example.test']);

        $admin = User::factory()->admin()->create();
        $adminToken = 'admin-blocked-reset-token';
        $admin->update([
            'api_token' => hash('sha256', $adminToken),
            'api_token_created_at' => now(),
        ]);

        $user = User::factory()->active()->state(['statut' => 'bloque'])->create([
            'pin_hash' => Hash::make('111111'),
            'pin_configured_at' => now(),
        ]);

        $linkResponse = $this
            ->withToken($adminToken)
            ->postJson('/api/admin/pin-reset-link', [
                'user_id' => $user->id,
                'confirmation_phrase' => 'RESET PIN',
            ])
            ->assertOk();

        parse_str((string) parse_url((string) $linkResponse->json('reset_url'), PHP_URL_QUERY), $query);

        $this->postJson('/api/pin/reset', [
            'token' => $query['token'],
            'pin' => '482951',
            'pin_confirmation' => '482951',
        ])
            ->assertOk()
            ->assertJsonPath('user.statut', 'bloque');

        $user->refresh();
        $this->assertSame('bloque', $user->statut);
        $this->assertTrue(Hash::check('482951', (string) $user->pin_hash));

        $this->postJson('/api/login', [
            'identifier' => $user->matricule,
            'pin' => '482951',
        ])
            ->assertForbidden()
            ->assertJsonPath('error_code', 'account_blocked');
    }
}
