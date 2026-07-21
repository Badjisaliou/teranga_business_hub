<?php

namespace Tests\Feature;

use App\Models\Cotisation;
use App\Models\MobileMoneyTransaction;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminPaiementIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_payment_filter_rejects_removed_paydunya_method(): void
    {
        $admin = User::factory()->admin()->create();
        $token = Str::random(60);
        $admin->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        $this
            ->withToken($token)
            ->getJson('/api/admin/paiements?methode_paiement=paydunya')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('methode_paiement');
    }

    public function test_admin_can_filter_payments_and_view_summary(): void
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
            'reference' => 'FINANCE-PARENT-SUCCESS',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'succes',
            'date_paiement' => now(),
        ]);
        Paiement::create([
            'user_id' => $member->id,
            'cotisation_id' => null,
            'type' => 'adhesion',
            'montant' => 10000,
            'reference' => 'FINANCE-PARENT-PENDING',
            'methode_paiement' => 'wave',
            'statut' => 'en_attente',
        ]);
        Paiement::create([
            'user_id' => $member->id,
            'cotisation_id' => $cotisation->id,
            'type' => 'cotisation',
            'montant' => 20000,
            'reference' => 'FINANCE-REPARTITION',
            'methode_paiement' => 'wave',
            'statut' => 'succes',
            'date_paiement' => now(),
        ]);

        $response = $this
            ->withToken($token)
            ->getJson('/api/admin/paiements?statut=succes');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.total_count', 1)
            ->assertJsonPath('summary.success_count', 1)
            ->assertJsonPath('summary.pending_count', 0)
            ->assertJsonPath('summary.total_success_amount', 20000);

        $withRepartition = $this
            ->withToken($token)
            ->getJson('/api/admin/paiements?statut=succes&include_repartition=1');

        $withRepartition
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.total_success_amount', 40000);
    }

    public function test_admin_can_view_and_remind_payment_incidents(): void
    {
        $admin = User::factory()->admin()->create();
        $token = Str::random(60);
        $admin->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        $member = User::factory()->member()->active()->create();

        MobileMoneyTransaction::create([
            'user_id' => $member->id,
            'type' => 'cotisation',
            'montant' => 10000,
            'reference' => 'INCIDENT-DEXPAY-FAILED',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'orange_money',
            'statut' => 'echoue',
            'failure_reason' => 'Paiement annule',
        ]);

        $this
            ->withToken($token)
            ->getJson('/api/admin/paiements')
            ->assertOk()
            ->assertJsonPath('summary.incident_failed_count', 1)
            ->assertJsonPath('incidents.0.reference', 'INCIDENT-DEXPAY-FAILED')
            ->assertJsonPath('incidents.0.canal_paiement', 'orange_money')
            ->assertJsonPath('incidents.0.failure_reason', 'Paiement annule');

        $this
            ->withToken($token)
            ->postJson('/api/admin/paiements/relance', [
                'reference' => 'INCIDENT-DEXPAY-FAILED',
                'source' => 'transaction',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Relance envoyee au membre.');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'type' => 'paiement',
            'statut' => 'non_lu',
        ]);
        $this->assertDatabaseHas('admin_actions', [
            'admin_id' => $admin->id,
            'cible_user_id' => $member->id,
            'action' => 'relance_paiement',
        ]);
    }

    public function test_admin_can_export_filtered_payments_csv(): void
    {
        $admin = User::factory()->admin()->create();
        $token = Str::random(60);
        $admin->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        $member = User::factory()->member()->active()->create([
            'matricule' => 'TBH-CSV-001',
            'nom' => 'Diallo',
            'prenom' => 'Aminata',
            'email' => 'aminata@example.test',
        ]);

        Paiement::create([
            'user_id' => $member->id,
            'cotisation_id' => null,
            'type' => 'adhesion',
            'montant' => 10000,
            'reference' => 'CSV-ADHESION-SUCCESS',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'wave',
            'statut' => 'succes',
            'date_paiement' => now(),
        ]);

        Paiement::create([
            'user_id' => $member->id,
            'cotisation_id' => null,
            'type' => 'cotisation',
            'montant' => 20000,
            'reference' => 'CSV-COTISATION-PENDING',
            'methode_paiement' => 'dexpay',
            'canal_paiement' => 'orange_money',
            'statut' => 'en_attente',
        ]);

        $response = $this
            ->withToken($token)
            ->get('/api/admin/exports/paiements-csv?type=adhesion&statut=succes');

        $response
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->assertHeader('Content-Disposition');

        $content = (string) $response->getContent();

        $this->assertStringContainsString('date_creation,reference,type,montant,methode_paiement,canal_paiement,statut,matricule,nom,prenom,email,mois_cotisation,annee_cotisation', $content);
        $this->assertStringContainsString('CSV-ADHESION-SUCCESS', $content);
        $this->assertStringContainsString('TBH-CSV-001,Diallo,Aminata,aminata@example.test', $content);
        $this->assertStringNotContainsString('CSV-COTISATION-PENDING', $content);
    }
}
