<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiTokenAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_session_requires_token(): void
    {
        $this->getJson('/api/session')
            ->assertUnauthorized()
            ->assertJsonPath('error_code', 'token_missing');
    }

    public function test_session_rejects_invalid_token(): void
    {
        $this->withToken('invalid-token')
            ->getJson('/api/session')
            ->assertUnauthorized()
            ->assertJsonPath('error_code', 'token_invalid');
    }

    public function test_session_rejects_expired_token_and_clears_it(): void
    {
        config()->set('auth.api_token_ttl_minutes', 1);
        [$user, $token] = $this->userWithToken([
            'api_token_created_at' => now()->subMinutes(2),
        ]);

        $this->withToken($token)
            ->getJson('/api/session')
            ->assertUnauthorized()
            ->assertJsonPath('error_code', 'token_expired');

        $user->refresh();
        $this->assertNull($user->api_token);
        $this->assertNull($user->api_token_created_at);
    }

    public function test_blocked_account_rejects_session_and_clears_token(): void
    {
        [$user, $token] = $this->userWithToken([
            'statut' => 'bloque',
        ]);

        $this->withToken($token)
            ->getJson('/api/session')
            ->assertForbidden()
            ->assertJsonPath('error_code', 'account_blocked');

        $user->refresh();
        $this->assertNull($user->api_token);
        $this->assertNull($user->api_token_created_at);
    }

    public function test_member_cannot_access_admin_routes(): void
    {
        [, $token] = $this->userWithToken();

        $this->withToken($token)
            ->getJson('/api/admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('error_code', 'forbidden');
    }

    public function test_login_sets_an_http_only_cookie_and_cookie_authenticates_session(): void
    {
        config()->set('auth.member_cookie_name', 'tbh_member_session');
        User::factory()->member()->active()->create([
            'telephone' => '771234567',
            'pin_hash' => Hash::make('482951'),
            'pin_configured_at' => now(),
        ]);

        $login = $this->postJson('/api/login', [
            'identifier' => '771234567',
            'pin' => '482951',
        ])->assertOk()->assertCookie('tbh_member_session');

        $this->call('GET', '/api/session', [], [
            'tbh_member_session' => (string) $login->json('token'),
        ], [], ['HTTP_ACCEPT' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('user.telephone', '771234567');
    }

    public function test_browser_login_does_not_expose_the_session_token_in_json(): void
    {
        config()->set('auth.member_cookie_name', 'tbh_member_session');
        User::factory()->member()->active()->create([
            'telephone' => '771234569',
            'pin_hash' => Hash::make('482951'),
            'pin_configured_at' => now(),
        ]);

        $this->withHeader('X-TBH-Portal', 'member')
            ->postJson('/api/login', [
                'identifier' => '771234569',
                'pin' => '482951',
            ])
            ->assertOk()
            ->assertCookie('tbh_member_session')
            ->assertJsonMissingPath('token');
    }

    public function test_cookie_authenticated_mutation_requires_a_trusted_origin(): void
    {
        config()->set('auth.member_cookie_name', 'tbh_member_session');
        config()->set('cors.allowed_origins', ['https://terangabusinesshub.com']);
        User::factory()->member()->active()->create([
            'telephone' => '771234568',
            'pin_hash' => Hash::make('482951'),
            'pin_configured_at' => now(),
        ]);

        $login = $this->postJson('/api/login', [
            'identifier' => '771234568',
            'pin' => '482951',
        ])->assertOk();

        $cookieValue = (string) $login->json('token');

        $this->call('POST', '/api/logout', [], [
            'tbh_member_session' => $cookieValue,
        ], [], ['HTTP_ACCEPT' => 'application/json'])
            ->assertForbidden()
            ->assertJsonPath('error_code', 'untrusted_origin');

        $this->call('POST', '/api/logout', [], [
            'tbh_member_session' => $cookieValue,
        ], [], [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_ORIGIN' => 'https://terangabusinesshub.com',
        ])
            ->assertOk()
            ->assertCookieExpired('tbh_member_session');
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array{0: User, 1: string}
     */
    private function userWithToken(array $overrides = []): array
    {
        $token = Str::random(60);
        $user = User::factory()->member()->active()->create([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
            ...$overrides,
        ]);

        return [$user, $token];
    }
}
