<?php

namespace App\Services;

use App\Models\User;
use DateTimeInterface;
use Illuminate\Validation\ValidationException;

class PinSecurityService
{
    /** @var list<string> */
    private const COMMON_PINS = [
        '000000', '111111', '222222', '333333', '444444',
        '555555', '666666', '777777', '888888', '999999',
        '012345', '123456', '234567', '345678', '456789',
        '987654', '876543', '765432', '654321', '543210',
        '121212', '112233', '123123', '101010', '696969',
    ];

    /**
     * @param array<string, mixed>|User $context
     */
    public function assertStrong(string $pin, array|User $context = []): void
    {
        if ($this->isStructurallyWeak($pin) || $this->matchesPersonalData($pin, $context)) {
            throw ValidationException::withMessages([
                'pin' => ['Ce PIN est trop facile a deviner. Choisissez six chiffres sans suite, repetition ni information personnelle.'],
            ]);
        }
    }

    private function isStructurallyWeak(string $pin): bool
    {
        return in_array($pin, self::COMMON_PINS, true)
            || preg_match('/^(\d)\1{5}$/', $pin) === 1
            || preg_match('/^(\d{2})\1{2}$/', $pin) === 1
            || preg_match('/^(\d{3})\1$/', $pin) === 1;
    }

    /**
     * @param array<string, mixed>|User $context
     */
    private function matchesPersonalData(string $pin, array|User $context): bool
    {
        $values = $context instanceof User ? $context->getAttributes() : $context;
        if ($context instanceof User) {
            $values['date_naissance'] = $context->date_naissance;
        }
        $candidates = [];

        foreach (['telephone', 'numero_cni', 'matricule'] as $field) {
            $digits = preg_replace('/\D+/', '', (string) ($values[$field] ?? '')) ?? '';
            if ($digits !== '') {
                $candidates[] = $digits;
            }
        }

        $birthDate = $values['date_naissance'] ?? null;
        if ($birthDate instanceof DateTimeInterface) {
            $candidates[] = $birthDate->format('Ymd');
            $candidates[] = $birthDate->format('dmY');
            $candidates[] = $birthDate->format('dmy');
        } elseif (is_string($birthDate) && $birthDate !== '') {
            $digits = preg_replace('/\D+/', '', $birthDate) ?? '';
            $candidates[] = $digits;
            if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $birthDate, $parts) === 1) {
                $candidates[] = $parts[3].$parts[2].$parts[1];
                $candidates[] = $parts[3].$parts[2].substr($parts[1], -2);
            }
        }

        foreach ($candidates as $candidate) {
            if (strlen($candidate) >= 6 && str_contains($candidate, $pin)) {
                return true;
            }
        }

        return false;
    }
}
