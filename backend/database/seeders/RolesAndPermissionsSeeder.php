<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create all permissions from the config
        foreach (Permission::MODULE_PERMISSIONS as $module => $permissions) {
            foreach ($permissions as $name => $displayName) {
                Permission::firstOrCreate(
                    ['name' => $name],
                    [
                        'display_name' => $displayName,
                        'module' => $module,
                    ]
                );
            }
        }

        // Create admin role with all permissions
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'display_name' => 'Администратор',
                'description' => 'Полный доступ ко всем функциям системы',
                'is_system' => true,
            ]
        );

        // Assign all permissions to admin
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));

        // Create manager role
        $managerRole = Role::firstOrCreate(
            ['name' => 'manager'],
            [
                'display_name' => 'Менеджер',
                'description' => 'Доступ к бухгалтерии и производству',
                'is_system' => false,
            ]
        );

        // Assign accounting and production permissions to manager
        $managerPermissions = Permission::whereIn('module', ['accounting', 'production', 'profile'])->get();
        $managerRole->permissions()->sync($managerPermissions->pluck('id'));

        // Create worker role
        $workerRole = Role::firstOrCreate(
            ['name' => 'worker'],
            [
                'display_name' => 'Работник',
                'description' => 'Доступ только к производству',
                'is_system' => false,
            ]
        );

        // Assign production view permissions to worker
        $workerPermissions = Permission::where('module', 'production')
            ->where('name', 'like', '%view%')
            ->orWhere('module', 'profile')
            ->get();
        $workerRole->permissions()->sync($workerPermissions->pluck('id'));

        $this->command->info('Roles and permissions seeded successfully!');
    }
}
