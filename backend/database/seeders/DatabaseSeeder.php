<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'matricule' => 'TBHADMINLOCAL',
                'nom' => 'Admin',
                'prenom' => 'Teranga',
                'telephone' => '771000000',
                'numero_cni' => '1000000000000',
                'adresse' => 'Local',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'statut' => 'actif',
                'date_adhesion' => now(),
                'date_expiration' => now()->addYear(),
            ],
        );
    }
}
