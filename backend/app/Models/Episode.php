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
        'video' => 'array',
    ];

    protected $attributes = [
        'video' => '{"hls_url":null,"status":"pending"}',
    ];
}
