<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'matricule' => 'TBH' . now()->format('ymd') . fake()->unique()->numberBetween(1000, 9999),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'email' => fake()->unique()->safeEmail(),
            'telephone' => '77' . fake()->unique()->numerify('#######'),
            'numero_cni' => fake()->unique()->numerify('#############'),
            'adresse' => fake()->address(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'membre',
            'statut' => 'actif',
            'date_adhesion' => now(),
            'date_expiration' => now()->addYear(),
            'cotisation_montant_mensuel' => 20000,
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
            'statut' => 'actif',
            'date_adhesion' => now(),
            'date_expiration' => now()->addYear(),
        ]);
    }

    public function member(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'membre',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'actif',
            'date_adhesion' => now(),
            'date_expiration' => now()->addYear(),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'actif',
            'date_adhesion' => now(),
            'date_expiration' => now()->addYear(),
        ]);
    }
}
