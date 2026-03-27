<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Auth\Passwords\CanResetPassword as CanResetPasswordTrait;
use Illuminate\Notifications\Notifiable;

class User extends Model implements AuthenticatableContract, CanResetPassword
{
    use HasApiTokens, HasRoles, Authenticatable, CanResetPasswordTrait, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'is_active',
        'email_verified_at',
        'subscription',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'subscription' => 'array',
        'password' => 'hashed',
    ];

    protected $attributes = [
        'is_active' => true,
        'subscription' => '{"plan":"free","status":"expired","trial_ends_at":null,"expires_at":null}',
    ];

    /**
     * Check if the user has an active subscription (trial or paid).
     */
    public function hasActiveSubscription(): bool
    {
        $subscription = $this->subscription;
        return in_array($subscription['status'] ?? 'expired', ['trial', 'active']);
    }
}
