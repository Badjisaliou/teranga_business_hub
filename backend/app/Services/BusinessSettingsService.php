<?php

namespace App\Services;

use App\Models\BusinessSetting;
use Illuminate\Validation\ValidationException;

class BusinessSettingsService
{
    /**
     * @return array<string, int>
     */
    public function all(): array
    {
        $defaults = $this->defaults();
        $stored = BusinessSetting::query()
            ->whereIn('key', array_keys($defaults))
            ->pluck('value', 'key')
            ->toArray();

        $result = [];
        foreach ($defaults as $key => $default) {
            $value = $stored[$key] ?? (string) $default;
            $result[$key] = (int) $value;
        }

        return $result;
    }

    public function getInt(string $key): int
    {
        $defaults = $this->defaults();
        $default = $defaults[$key] ?? null;
        if ($default === null) {
            throw ValidationException::withMessages([
                'key' => ['Cle de parametre metier inconnue.'],
            ]);
        }

        $value = BusinessSetting::query()->where('key', $key)->value('value');
        return $value !== null ? (int) $value : $default;
    }

    /**
     * @param array<string, mixed> $updates
     * @return array<string, int>
     */
    public function update(array $updates): array
    {
        $validated = [];
        foreach ($updates as $key => $value) {
            if (!array_key_exists($key, $this->defaults())) {
                throw ValidationException::withMessages([
                    'settings' => ["Cle non autorisee: {$key}."],
                ]);
            }

            if (!is_int($value) || $value <= 0) {
                throw ValidationException::withMessages([
                    'settings' => ["La valeur de {$key} doit etre un entier strictement positif."],
                ]);
            }

            $validated[$key] = $value;
        }

        foreach ($validated as $key => $value) {
            BusinessSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value]
            );
        }

        return $this->all();
    }

    /**
     * @return array<string, int>
     */
    public function defaults(): array
    {
        return [
            'cotisation_montant_mensuel' => 20000,
            'auto_block_unsold_months_threshold' => 2,
        ];
    }
}
