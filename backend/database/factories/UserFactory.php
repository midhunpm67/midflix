<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
            'subscription' => [
                'plan' => 'free',
                'status' => 'expired',
                'trial_ends_at' => null,
                'expires_at' => null,
            ],
        ];
    }

    /**
     * Active subscriber state.
     */
    public function subscriber(): static
    {
        return $this->state(fn () => [
            'subscription' => [
                'plan' => 'basic',
                'status' => 'active',
                'trial_ends_at' => null,
                'expires_at' => now()->addMonth()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Trial subscriber state.
     */
    public function onTrial(): static
    {
        return $this->state(fn () => [
            'subscription' => [
                'plan' => 'free',
                'status' => 'trial',
                'trial_ends_at' => now()->addDays(14)->toIso8601String(),
                'expires_at' => null,
            ],
        ]);
    }

    /**
     * Admin user state — use a unique email to avoid collision in tests.
     * Role assignment is handled by the RoleSeeder or test setup.
     */
    public function admin(): static
    {
        return $this->state(fn () => [
            'email' => 'admin-' . fake()->unique()->randomNumber(5) . '@midflix.com',
        ]);
    }
}
