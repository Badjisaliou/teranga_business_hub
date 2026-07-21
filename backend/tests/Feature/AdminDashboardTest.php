<?php

namespace Tests\Feature;

use App\Models\AdhesionApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_exposes_unfinished_adhesion_applications(): void
    {
        [, $token] = $this->adminWithToken();

        $application = AdhesionApplication::create([
            'public_id' => '00000000-0000-0000-0000-000000000101',
            'civilite' => 'M',
            'prenom' => 'Aminata',
            'nom' => 'Diop',
            'date_naissance' => '1990-01-15',
            'telephone' => '771234567',
            'email' => null,
            'pays_residence' => 'Senegal',
            'region' => 'Dakar',
            'departement' => 'Dakar',
            'commune' => 'Medina',
            'numero_cni' => '1234567890',
            'conditions_acceptees' => true,
            'statut' => 'draft',
            'montant_adhesion' => 10000,
            'expires_at' => now()->addDay(),
        ]);

        $this->withToken($token)
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('adhesion_applications_non_finalisees.0.id', $application->id)
            ->assertJsonPath('adhesion_applications_non_finalisees.0.statut', 'draft');
    }

    /**
     * @return array{0: User, 1: string}
     */
    private function adminWithToken(): array
    {
        $token = Str::random(60);
        $user = User::factory()->admin()->active()->create([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
        ]);

        return [$user, $token];
    }
}
