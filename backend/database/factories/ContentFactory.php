<?php

namespace Database\Factories;

use App\Models\Content;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ContentFactory extends Factory
{
    protected $model = Content::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(3, false);

        return [
            'title'        => $title,
            'slug'         => Str::slug($title),
            'description'  => $this->faker->paragraph(),
            'type'         => $this->faker->randomElement(['movie', 'series']),
            'genre_ids'    => [],
            'cast'         => [],
            'director'     => $this->faker->name(),
            'year'         => $this->faker->numberBetween(1990, 2024),
            'rating'       => $this->faker->randomElement(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14']),
            'poster_url'   => null,
            'backdrop_url' => null,
            'trailer_url'  => null,
            'video'        => ['playback_id' => null, 'status' => 'pending'],
            'is_published' => false,
            'view_count'   => 0,
        ];
    }
}
