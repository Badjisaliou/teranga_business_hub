<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserStatusSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_status_defaults_to_active(): void
    {
        $id = DB::table('users')->insertGetId([
            'matricule' => 'TBH-STATUS-DEFAULT',
            'nom' => 'Test',
            'prenom' => 'Statut',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertSame('actif', DB::table('users')->where('id', $id)->value('statut'));
    }

    public function test_user_status_rejects_legacy_values(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            $this->markTestSkipped('SQLite ne materialise pas la contrainte enum utilisee par PostgreSQL.');
        }

        $this->expectException(QueryException::class);

        DB::table('users')->insert([
            'matricule' => 'TBH-STATUS-LEGACY',
            'nom' => 'Test',
            'prenom' => 'Statut',
            'statut' => 'en_attente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
