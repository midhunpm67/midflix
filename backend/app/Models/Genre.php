<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Genre extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'genres';

    protected $fillable = [
        'name',
        'slug',
    ];
}
