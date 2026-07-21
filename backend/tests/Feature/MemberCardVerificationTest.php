<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MemberCardVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_member_card_can_be_verified_publicly(): void
    {
        $user = User::factory()->active()->create([
            'card_token' => Str::random(64),
            'card_issued_at' => now(),
            'date_expiration' => now()->addYear(),
        ]);

        $response = $this->getJson('/api/member-card/verify/' . $user->card_token);

        $response
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('reason', null)
            ->assertJsonPath('card.matricule', $user->matricule)
            ->assertJsonPath('card.statut', 'actif');
    }

    public function test_blocked_member_card_is_publicly_invalid(): void
    {
        $user = User::factory()->active()->create([
            'statut' => 'bloque',
            'card_token' => Str::random(64),
            'card_issued_at' => now(),
            'date_expiration' => now()->addYear(),
        ]);

        $response = $this->getJson('/api/member-card/verify/' . $user->card_token);

        $response
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'account_blocked')
            ->assertJsonPath('card.matricule', $user->matricule);
    }

    public function test_expired_member_card_is_publicly_invalid(): void
    {
        $user = User::factory()->active()->create([
            'card_token' => Str::random(64),
            'card_issued_at' => now()->subYear(),
            'date_expiration' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/member-card/verify/' . $user->card_token);

        $response
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('reason', 'card_expired');
    }

    public function test_unknown_member_card_token_returns_not_found(): void
    {
        $this->getJson('/api/member-card/verify/unknown-token')
            ->assertNotFound();
    }

    public function test_member_card_endpoint_generates_missing_card_token_for_existing_member(): void
    {
        $user = User::factory()->active()->create([
            'card_token' => null,
            'card_issued_at' => null,
            'date_expiration' => now()->addYear(),
        ]);
        $token = Str::random(60);
        $user->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        $response = $this->withToken($token)->getJson('/api/member-card');

        $response
            ->assertOk()
            ->assertJsonPath('card.matricule', $user->matricule)
            ->assertJsonPath('card.is_valid', true)
            ->assertJsonStructure([
                'card' => [
                    'verification_url',
                    'card_issued_at',
                ],
            ]);

        $this->assertNotNull($user->fresh()->card_token);
        $this->assertNotNull($user->fresh()->card_issued_at);
    }
}
