<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);

        // Create default admin if not exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@midflix.com'],
            [
                'name' => 'MidFlix Admin',
                'password' => Hash::make(env('ADMIN_SEED_PASSWORD', 'admin123456')),
                'is_active' => true,
                'subscription' => [
                    'plan' => 'premium',
                    'status' => 'active',
                    'trial_ends_at' => null,
                    'expires_at' => null,
                ],
            ]
        );

        $admin->assignRole($adminRole);
    }
}
