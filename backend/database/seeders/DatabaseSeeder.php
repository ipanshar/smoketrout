<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // Create admin user
        $adminRole = Role::where('name', 'admin')->first();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@smoketrout.local',
            'role_id' => $adminRole?->id,
        ]);
    }
}
