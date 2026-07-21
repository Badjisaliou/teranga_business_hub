<?php

namespace App\Services;

class ContactValidationService
{
    public function normalizeSenegalPhone(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $input) ?? '';

        if (str_starts_with($digits, '221') && strlen($digits) === 12) {
            $digits = substr($digits, 3);
        }

        return $digits;
    }

    public function isValidSenegalPhone(?string $input): bool
    {
        $normalized = $this->normalizeSenegalPhone($input);
        if ($normalized === null) {
            return false;
        }

        return (bool) preg_match('/^7[05678][0-9]{7}$/', $normalized);
    }

    public function isValidSenegalCni(?string $input): bool
    {
        if ($input === null) {
            return false;
        }

        $normalized = preg_replace('/\s+/', '', $input) ?? '';

        return (bool) preg_match('/^[0-9]{10,15}$/', $normalized);
    }
}
