<?php

namespace App\Models;

use Laravel\Sanctum\Contracts\HasAbilities;
use MongoDB\Laravel\Eloquent\Model;

class PersonalAccessToken extends Model implements HasAbilities
{
    protected $connection = 'mongodb';
    protected $collection = 'personal_access_tokens';

    protected $fillable = [
        'name',
        'token',
        'abilities',
        'last_used_at',
        'expires_at',
    ];

    protected $hidden = ['token'];

    protected $casts = [
        'abilities' => 'json',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Determine if the token has a given ability.
     */
    public function can($ability): bool
    {
        return in_array('*', $this->abilities ?? [])
            || in_array($ability, $this->abilities ?? []);
    }

    /**
     * Determine if the token is missing a given ability.
     */
    public function cant($ability): bool
    {
        return ! $this->can($ability);
    }

    /**
     * Get the tokenable model that the access token belongs to.
     */
    public function tokenable()
    {
        return $this->morphTo('tokenable');
    }
}
