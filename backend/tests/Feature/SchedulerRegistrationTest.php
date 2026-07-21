<?php

namespace Tests\Feature;

use Tests\TestCase;

class SchedulerRegistrationTest extends TestCase
{
    public function test_expected_scheduler_commands_are_registered(): void
    {
        $this->artisan('schedule:list')
            ->expectsOutputToContain('adhesion-applications:expire-stale')
            ->expectsOutputToContain('cotisations:mark-overdue')
            ->expectsOutputToContain('memberships:diagnose-payment-defaults --notify')
            ->expectsOutputToContain('memberships:notify-expiration')
            ->expectsOutputToContain('data:prune-expired')
            ->assertExitCode(0);
    }
}
