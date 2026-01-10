<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class AssignAdminRole extends Command
{
    protected $signature = 'user:make-admin {email}';
    protected $description = 'Assign admin role to a user by email';

    public function handle(): int
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email {$email} not found");
            return 1;
        }

        $adminRole = Role::where('name', 'admin')->first();
        
        if (!$adminRole) {
            $this->error('Admin role not found. Run: php artisan db:seed --class=RolesAndPermissionsSeeder');
            return 1;
        }

        $user->role_id = $adminRole->id;
        $user->save();

        $this->info("User {$email} is now an administrator!");
        
        return 0;
    }
}
