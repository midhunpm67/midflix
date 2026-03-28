<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Episode extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'episodes';

    protected $fillable = [
        'season_id',
        'content_id',
        'number',
        'title',
        'description',
        'duration',
        'thumbnail_url',
        'video',
    ];

    protected $casts = [
        'number' => 'integer',
        'duration' => 'integer',
    ];

    protected $attributes = [
        'video' => '{"playback_id":null,"status":"pending"}',
    ];
}
