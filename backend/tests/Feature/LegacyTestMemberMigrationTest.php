<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegacyTestMemberMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_test_member_migration_never_mutates_user_three(): void
    {
        User::factory()->admin()->create();
        User::factory()->member()->active()->create();
        $user = User::factory()->member()->active()->create([
            'matricule' => 'TBH-USER-THREE',
            'pin_hash' => null,
            'pin_configured_at' => null,
            'card_token' => null,
            'card_issued_at' => null,
        ]);

        $this->assertSame(3, $user->id);
        $before = $user->fresh()->getAttributes();

        $migration = require database_path('migrations/2026_07_10_000006_activate_test_member_user.php');
        $migration->up();
        $migration->down();

        $this->assertSame($before, $user->fresh()->getAttributes());
    }
}
