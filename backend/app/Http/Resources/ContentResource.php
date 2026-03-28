<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => (string) $this->_id,
            'title'        => $this->title,
            'slug'         => $this->slug,
            'description'  => $this->description,
            'type'         => $this->type,
            'genre_ids'    => $this->genre_ids ?? [],
            'cast'         => $this->cast ?? [],
            'director'     => $this->director,
            'year'         => $this->year,
            'rating'       => $this->rating,
            'poster_url'   => $this->poster_url,
            'backdrop_url' => $this->backdrop_url,
            'trailer_url'  => $this->trailer_url,
            'video'        => $this->video,
            'is_published' => $this->is_published,
            'view_count'   => $this->view_count,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
