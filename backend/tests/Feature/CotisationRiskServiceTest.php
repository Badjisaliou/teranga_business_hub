<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\Cotisation;
use App\Models\Notification;
use App\Models\User;
use App\Services\CotisationRiskService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CotisationRiskServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_it_marks_only_previous_unpaid_or_partial_months_as_overdue(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        $member = User::factory()->member()->active()->create();

        $previousUnpaid = Cotisation::create([
            'user_id' => $member->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ]);
        $currentUnpaid = Cotisation::create([
            'user_id' => $member->id,
            'mois' => 5,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ]);
        $previousPaid = Cotisation::create([
            'user_id' => $member->id,
            'mois' => 3,
            'annee' => 2026,
            'montant_paye' => 20000,
            'statut' => 'a_jour',
        ]);

        $updated = app(CotisationRiskService::class)->markOverdue();

        $this->assertSame(1, $updated);
        $this->assertSame('en_retard', $previousUnpaid->fresh()->statut);
        $this->assertSame('non_paye', $currentUnpaid->fresh()->statut);
        $this->assertSame('a_jour', $previousPaid->fresh()->statut);
    }

    public function test_it_marks_overdue_only_for_active_members(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        $activeMember = User::factory()->member()->active()->create();
        $blockedMember = User::factory()->member()->active()->state(['statut' => 'bloque'])->create();
        $otherBlockedMember = User::factory()->member()->active()->state(['statut' => 'bloque'])->create();

        $activeCotisation = Cotisation::create([
            'user_id' => $activeMember->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ]);
        $blockedCotisation = Cotisation::create([
            'user_id' => $blockedMember->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ]);
        $otherBlockedCotisation = Cotisation::create([
            'user_id' => $otherBlockedMember->id,
            'mois' => 4,
            'annee' => 2026,
            'montant_paye' => 0,
            'statut' => 'non_paye',
        ]);

        $updated = app(CotisationRiskService::class)->markOverdue();

        $this->assertSame(1, $updated);
        $this->assertSame('en_retard', $activeCotisation->fresh()->statut);
        $this->assertSame('non_paye', $blockedCotisation->fresh()->statut);
        $this->assertSame('non_paye', $otherBlockedCotisation->fresh()->statut);
    }

    public function test_diagnosis_detects_members_at_risk_without_blocking_them(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        BusinessSetting::create([
            'key' => 'payment_warning_unsold_months_threshold',
            'value' => '1',
        ]);
        $member = User::factory()->member()->active()->create();

        foreach ([[3, 2026], [4, 2026]] as [$month, $year]) {
            Cotisation::create([
                'user_id' => $member->id,
                'mois' => $month,
                'annee' => $year,
                'montant_paye' => 0,
                'statut' => 'en_retard',
            ]);
        }

        $risks = app(CotisationRiskService::class)->membersAtRisk();

        $this->assertCount(1, $risks);
        $this->assertSame($member->id, $risks->first()['id']);
        $this->assertSame(2, $risks->first()['mois_non_soldes']);
        $this->assertSame('actif', $member->fresh()->statut);
    }

    public function test_manual_block_uses_block_threshold_not_warning_threshold(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        BusinessSetting::create(['key' => 'payment_warning_unsold_months_threshold', 'value' => '1']);
        BusinessSetting::create(['key' => 'auto_block_unsold_months_threshold', 'value' => '3']);

        $member = User::factory()->member()->active()->create();

        foreach ([[3, 2026], [4, 2026]] as [$month, $year]) {
            Cotisation::create([
                'user_id' => $member->id,
                'mois' => $month,
                'annee' => $year,
                'montant_paye' => 0,
                'statut' => 'en_retard',
            ]);
        }

        $this->assertCount(1, app(CotisationRiskService::class)->membersAtRisk());
        $this->assertSame(0, app(CotisationRiskService::class)->blockMembersAtRisk());
        $this->assertSame('actif', $member->fresh()->statut);
    }

    public function test_diagnosis_command_can_notify_members_at_risk_without_blocking(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        BusinessSetting::create([
            'key' => 'auto_block_unsold_months_threshold',
            'value' => '2',
        ]);
        $member = User::factory()->member()->active()->create();

        foreach ([[3, 2026], [4, 2026]] as [$month, $year]) {
            Cotisation::create([
                'user_id' => $member->id,
                'mois' => $month,
                'annee' => $year,
                'montant_paye' => 0,
                'statut' => 'non_paye',
            ]);
        }

        $this->artisan('memberships:diagnose-payment-defaults --notify')
            ->expectsOutput('Cotisations marquees en retard: 2')
            ->expectsOutput('Membres a risque de blocage: 1')
            ->expectsOutput('Notifications retard envoyees: 1')
            ->assertExitCode(0);

        $this->assertSame('actif', $member->fresh()->statut);
        $this->assertSame(1, Notification::where('user_id', $member->id)->where('type', 'retard')->count());
    }

    public function test_auto_block_command_requires_force_option(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        $member = User::factory()->member()->active()->create();

        foreach ([[3, 2026], [4, 2026]] as [$month, $year]) {
            Cotisation::create([
                'user_id' => $member->id,
                'mois' => $month,
                'annee' => $year,
                'montant_paye' => 0,
                'statut' => 'en_retard',
            ]);
        }

        $this->artisan('memberships:auto-block-payment-default')
            ->expectsOutput('Commande non executee. Ajoutez --force pour bloquer les membres a risque.')
            ->assertExitCode(1);

        $this->assertSame('actif', $member->fresh()->statut);
    }

    public function test_auto_block_command_blocks_only_active_members_with_force(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 12, 10));
        BusinessSetting::create(['key' => 'auto_block_unsold_months_threshold', 'value' => '2']);

        $activeMember = User::factory()->member()->active()->create([
            'api_token' => hash('sha256', 'active-token'),
            'api_token_created_at' => now(),
        ]);
        $blockedMember = User::factory()->member()->active()->state([
            'statut' => 'bloque',
            'api_token' => hash('sha256', 'blocked-token'),
            'api_token_created_at' => now(),
        ])->create();

        foreach ([$activeMember, $blockedMember] as $member) {
            foreach ([[3, 2026], [4, 2026]] as [$month, $year]) {
                Cotisation::create([
                    'user_id' => $member->id,
                    'mois' => $month,
                    'annee' => $year,
                    'montant_paye' => 0,
                    'statut' => 'en_retard',
                ]);
            }
        }

        $this->artisan('memberships:auto-block-payment-default --force')
            ->expectsOutput('Comptes bloques: 1')
            ->assertExitCode(0);

        $activeMember->refresh();
        $blockedMember->refresh();

        $this->assertSame('bloque', $activeMember->statut);
        $this->assertNull($activeMember->api_token);
        $this->assertNull($activeMember->api_token_created_at);
        $this->assertSame('bloque', $blockedMember->statut);
        $this->assertNotNull($blockedMember->api_token);
        $this->assertSame(1, Notification::where('user_id', $activeMember->id)->where('type', 'retard')->count());
        $this->assertSame(0, Notification::where('user_id', $blockedMember->id)->where('type', 'retard')->count());
    }
}
