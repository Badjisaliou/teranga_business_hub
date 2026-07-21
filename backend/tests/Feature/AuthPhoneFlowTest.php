<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthPhoneFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_member_registration_endpoint_is_closed(): void
    {
        $response = $this->postJson('/api/register', [
            'nom' => 'Diallo',
            'prenom' => 'Awa',
            'email' => null,
            'telephone' => '771234567',
            'numero_cni' => '1234567890123',
            'password' => 'password123',
        ]);

        $response
            ->assertStatus(410)
            ->assertJsonPath('error_code', 'member_registration_moved_to_adhesion');

        $this->assertNull(User::where('telephone', '771234567')->first());
    }

    public function test_member_can_login_with_phone_number_and_pin(): void
    {
        User::factory()->member()->active()->create([
            'email' => null,
            'telephone' => '771234567',
            'pin_hash' => Hash::make('123456'),
            'pin_configured_at' => now(),
        ]);

        $this->postJson('/api/login', [
            'identifier' => '771234567',
            'pin' => '123456',
        ])
            ->assertOk()
            ->assertJsonPath('user.telephone', '771234567')
            ->assertJsonStructure(['token']);
    }

    public function test_legacy_password_reset_endpoints_are_removed(): void
    {
        $this->postJson('/api/forgot-password', [
            'channel' => 'email',
            'identifier' => 'membre@example.test',
        ])->assertNotFound();

        $this->postJson('/api/reset-password', [
            'identifier' => 'membre@example.test',
            'token' => 'token',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertNotFound();
    }

    public function test_phone_verification_endpoint_is_removed(): void
    {
        $this->postJson('/api/register/phone-code', [
            'telephone' => '771234567',
        ])
            ->assertNotFound();
    }
}
