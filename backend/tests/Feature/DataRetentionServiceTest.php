<?php

namespace Tests\Feature;

use App\Services\DataRetentionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DataRetentionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_prunes_only_expired_technical_and_abandoned_data(): void
    {
        config(['session.lifetime' => 120, 'services.adhesion.abandoned_retention_days' => 30]);

        DB::table('sessions')->insert([
            ['id' => 'expired-session', 'payload' => 'x', 'last_activity' => now()->subHours(3)->timestamp],
            ['id' => 'active-session', 'payload' => 'x', 'last_activity' => now()->subMinutes(10)->timestamp],
        ]);
        DB::table('cache')->insert([
            ['key' => 'expired-cache', 'value' => 'x', 'expiration' => now()->subMinute()->timestamp],
            ['key' => 'active-cache', 'value' => 'x', 'expiration' => now()->addHour()->timestamp],
        ]);
        DB::table('cache_locks')->insert([
            ['key' => 'expired-lock', 'owner' => 'test', 'expiration' => now()->subMinute()->timestamp],
            ['key' => 'active-lock', 'owner' => 'test', 'expiration' => now()->addHour()->timestamp],
        ]);

        $paid = $this->insertApplication('paid', 'DEXPAY-PAID', now()->subDays(40), 'paid-pin');
        $abandoned = $this->insertApplication('expired', null, now()->subDays(31), 'abandoned-pin');
        $recent = $this->insertApplication('expired', null, now()->subDays(5), 'recent-pin');
        $referenced = $this->insertApplication('expired', 'DEXPAY-KEEP', now()->subDays(90), 'referenced-pin');

        $this->assertSame([
            'sessions' => 1,
            'cache' => 1,
            'cache_locks' => 1,
            'paid_pin_hashes' => 1,
            'abandoned_adhesions' => 1,
        ], app(DataRetentionService::class)->prune());

        $this->assertDatabaseMissing('sessions', ['id' => 'expired-session']);
        $this->assertDatabaseHas('sessions', ['id' => 'active-session']);
        $this->assertDatabaseMissing('adhesion_applications', ['id' => $abandoned]);
        $this->assertDatabaseHas('adhesion_applications', ['id' => $recent]);
        $this->assertDatabaseHas('adhesion_applications', ['id' => $referenced, 'pin_hash' => 'referenced-pin']);
        $this->assertDatabaseHas('adhesion_applications', ['id' => $paid, 'pin_hash' => null]);
    }

    private function insertApplication(string $status, ?string $reference, \DateTimeInterface $updatedAt, string $pinHash): int
    {
        return DB::table('adhesion_applications')->insertGetId([
            'public_id' => (string) Str::uuid(),
            'civilite' => 'Mme',
            'prenom' => 'Test',
            'nom' => 'Retention',
            'date_naissance' => '1990-01-01',
            'telephone' => '77'.random_int(1000000, 9999999),
            'email' => null,
            'pays_residence' => 'Senegal',
            'region' => 'Dakar',
            'departement' => 'Dakar',
            'commune' => 'Dakar',
            'numero_cni' => (string) random_int(1000000000, 1999999999),
            'pin_hash' => $pinHash,
            'conditions_acceptees' => true,
            'statut' => $status,
            'montant_adhesion' => 10000,
            'payment_reference' => $reference,
            'created_at' => $updatedAt,
            'updated_at' => $updatedAt,
        ]);
    }
}
