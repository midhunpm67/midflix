<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Season extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'seasons';

    protected $fillable = [
        'content_id',
        'number',
        'title',
        'description',
    ];

    protected $casts = [
        'number' => 'integer',
    ];
}
