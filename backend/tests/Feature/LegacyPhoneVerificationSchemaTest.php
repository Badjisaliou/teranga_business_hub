<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LegacyPhoneVerificationSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_phone_verification_schema_is_absent(): void
    {
        $this->assertFalse(Schema::hasTable('phone_verification_codes'));
        $this->assertFalse(Schema::hasColumn('users', 'telephone_verifie_at'));
    }
}
