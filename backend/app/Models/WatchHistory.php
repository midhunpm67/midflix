<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class WatchHistory extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'watch_history';

    protected $fillable = [
        'user_id',
        'content_id',
        'episode_id',
        'progress_seconds',
        'duration_seconds',
        'completed',
    ];

    protected $casts = [
        'progress_seconds' => 'integer',
        'duration_seconds' => 'integer',
        'completed'        => 'boolean',
    ];

    protected $attributes = [
        'completed' => false,
    ];
}
