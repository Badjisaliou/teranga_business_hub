<?php

namespace Tests\Feature;

use App\Models\AdminAction;
use App\Models\Cotisation;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminMemberDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_member_detail_with_business_history(): void
    {
        $admin = User::factory()->admin()->create();
        $token = Str::random(60);
        $admin->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        $member = User::factory()->member()->active()->create();
        $cotisation = Cotisation::create([
            'user_id' => $member->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 20000,
            'statut' => 'a_jour',
        ]);
        Paiement::create([
            'user_id' => $member->id,
            'cotisation_id' => null,
            'type' => 'cotisation',
            'montant' => 20000,
            'reference' => 'DETAIL-PARENT-001',
            'methode_paiement' => 'wave',
            'statut' => 'succes',
            'date_paiement' => now(),
        ]);
        Paiement::create([
            'user_id' => $member->id,
            'cotisation_id' => $cotisation->id,
            'type' => 'cotisation',
            'montant' => 20000,
            'reference' => 'DETAIL-COT-001',
            'methode_paiement' => 'wave',
            'statut' => 'succes',
            'date_paiement' => now(),
        ]);
        Notification::create([
            'user_id' => $member->id,
            'message' => 'Votre cotisation a ete validee.',
            'type' => 'paiement',
            'statut' => 'non_lu',
            'date_envoi' => now(),
        ]);
        AdminAction::create([
            'admin_id' => $admin->id,
            'cible_user_id' => $member->id,
            'action' => 'deblocage',
            'description' => 'Deblocage test',
            'date_action' => now(),
        ]);

        $response = $this
            ->withToken($token)
            ->getJson("/api/admin/membres/{$member->id}");

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $member->id)
            ->assertJsonPath('summary.total_paiements_succes', 20000)
            ->assertJsonPath('summary.cotisations_a_jour', 1)
            ->assertJsonPath('summary.notifications_non_lues', 1)
            ->assertJsonCount(1, 'cotisations')
            ->assertJsonCount(1, 'paiements')
            ->assertJsonCount(1, 'notifications')
            ->assertJsonCount(1, 'admin_actions');
    }

    public function test_admin_block_member_requires_confirmation_phrase(): void
    {
        [$admin, $token] = $this->actingAdmin();
        $member = User::factory()->member()->active()->create();

        $response = $this
            ->withToken($token)
            ->postJson('/api/admin/block-user', [
                'user_id' => $member->id,
                'description' => 'Blocage test',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('confirmation_phrase');

        $this->assertSame('actif', $member->fresh()->statut);
        $this->assertDatabaseMissing('admin_actions', [
            'admin_id' => $admin->id,
            'cible_user_id' => $member->id,
            'action' => 'blocage',
        ]);
    }

    public function test_admin_can_block_member_with_confirmation_phrase(): void
    {
        [$admin, $token] = $this->actingAdmin();
        $member = User::factory()->member()->active()->create();

        $response = $this
            ->withToken($token)
            ->postJson('/api/admin/block-user', [
                'user_id' => $member->id,
                'description' => 'Blocage test',
                'confirmation_phrase' => 'BLOQUER',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.statut', 'bloque');

        $this->assertSame('bloque', $member->fresh()->statut);
        $this->assertDatabaseHas('admin_actions', [
            'admin_id' => $admin->id,
            'cible_user_id' => $member->id,
            'action' => 'blocage',
        ]);
    }

    public function test_admin_validation_and_rejection_routes_are_removed(): void
    {
        [, $token] = $this->actingAdmin();
        $member = User::factory()->member()->active()->create();

        $this
            ->withToken($token)
            ->postJson('/api/admin/validate-user', [
                'user_id' => $member->id,
                'description' => 'Ancien parcours',
            ])
            ->assertNotFound();

        $this
            ->withToken($token)
            ->postJson('/api/admin/reject-user', [
                'user_id' => $member->id,
                'description' => 'Ancien parcours',
            ])
            ->assertNotFound();

        $this->assertSame('actif', $member->fresh()->statut);
    }

    public function test_admin_member_list_exposes_only_final_member_statuses(): void
    {
        [, $token] = $this->actingAdmin();
        $active = User::factory()->member()->active()->create();
        $blocked = User::factory()->member()->active()->state(['statut' => 'bloque'])->create();

        $response = $this
            ->withToken($token)
            ->getJson('/api/admin/membres');

        $response
            ->assertOk()
            ->assertJsonPath('stats.total_membres', 2)
            ->assertJsonPath('stats.actifs', 1)
            ->assertJsonPath('stats.bloques', 1)
            ->assertJsonMissingPath('stats.en_attente')
            ->assertJsonMissingPath('stats.attente_adhesion')
            ->assertJsonMissingPath('stats.rejetes')
            ->assertJsonCount(2, 'data');

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertEqualsCanonicalizing([$active->id, $blocked->id], $ids);
    }

    public function test_admin_can_filter_members_by_card_status(): void
    {
        [, $token] = $this->actingAdmin();
        $valid = User::factory()->member()->active()->create([
            'card_token' => 'valid-card-token',
            'date_expiration' => now()->addYear(),
        ]);
        $expired = User::factory()->member()->active()->create([
            'card_token' => 'expired-card-token',
            'date_expiration' => now()->subDay(),
        ]);
        $blocked = User::factory()->member()->active()->state(['statut' => 'bloque'])->create([
            'card_token' => 'blocked-card-token',
            'date_expiration' => now()->addYear(),
        ]);
        User::factory()->member()->active()->create([
            'card_token' => null,
            'date_expiration' => now()->addYear(),
        ]);

        $validResponse = $this
            ->withToken($token)
            ->getJson('/api/admin/membres?card_status=valide');

        $validResponse
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $valid->id)
            ->assertJsonPath('stats.cartes_expirees', 1)
            ->assertJsonPath('stats.cartes_invalides', 3);

        $expiredResponse = $this
            ->withToken($token)
            ->getJson('/api/admin/membres?card_status=expiree');

        $expiredResponse
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $expired->id);

        $invalidResponse = $this
            ->withToken($token)
            ->getJson('/api/admin/membres?card_status=invalide');

        $invalidIds = collect($invalidResponse->json('data'))->pluck('id')->all();
        $this->assertContains($expired->id, $invalidIds);
        $this->assertContains($blocked->id, $invalidIds);
        $this->assertNotContains($valid->id, $invalidIds);
    }

    public function test_admin_can_filter_and_search_audit_actions(): void
    {
        [$admin, $token] = $this->actingAdmin();
        $targetMember = User::factory()->member()->active()->create([
            'nom' => 'Auditcible',
            'prenom' => 'Membre',
            'matricule' => 'TBH-AUDIT-001',
        ]);
        $otherMember = User::factory()->member()->active()->create([
            'nom' => 'Autre',
            'prenom' => 'Membre',
        ]);

        AdminAction::create([
            'admin_id' => $admin->id,
            'cible_user_id' => $targetMember->id,
            'action' => 'blocage',
            'description' => 'Blocage audit recherche',
            'date_action' => now()->subMinute(),
        ]);
        AdminAction::create([
            'admin_id' => $admin->id,
            'cible_user_id' => $otherMember->id,
            'action' => 'deblocage',
            'description' => 'Deblocage autre membre',
            'date_action' => now(),
        ]);

        $response = $this
            ->withToken($token)
            ->getJson('/api/admin/actions?action=blocage&q=TBH-AUDIT-001');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'blocage')
            ->assertJsonPath('data.0.cible_user.id', $targetMember->id)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('summary.total_actions', 2)
            ->assertJsonPath('summary.blocages', 1)
            ->assertJsonPath('summary.deblocages', 1)
            ->assertJsonMissingPath('summary.validations')
            ->assertJsonMissingPath('summary.rejets');
    }

    /**
     * @return array{0: User, 1: string}
     */
    private function actingAdmin(): array
    {
        $admin = User::factory()->admin()->create();
        $token = Str::random(60);
        $admin->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        return [$admin, $token];
    }
}
