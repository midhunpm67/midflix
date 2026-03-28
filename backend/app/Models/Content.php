<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Content extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'content';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'type',
        'genre_ids',
        'cast',
        'director',
        'year',
        'rating',
        'duration',
        'language',
        'imdb_rating',
        'is_featured',
        'poster_url',
        'backdrop_url',
        'trailer_url',
        'video',
        'is_published',
        'view_count',
        'published_at',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_featured'  => 'boolean',
        'view_count'   => 'integer',
        'published_at' => 'datetime',
        'year'         => 'integer',
        'duration'     => 'integer',
    ];

    protected $attributes = [
        'is_published' => false,
        'is_featured'  => false,
        'view_count'   => 0,
    ];
}
