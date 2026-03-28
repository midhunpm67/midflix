<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => (string) $this->_id,
            'title'        => $this->title,
            'slug'         => $this->slug,
            'type'         => $this->type,
            'year'         => $this->year,
            'rating'       => $this->rating,
            'poster_url'   => $this->poster_url,
            'backdrop_url' => $this->backdrop_url,
            'genre_ids'    => $this->genre_ids ?? [],
            'is_published' => $this->is_published,
            'view_count'   => $this->view_count,
            'video'        => $this->video,
            'is_featured'  => $this->is_featured ?? false,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at'   => $this->created_at?->toIso8601String(),
        ];
    }
}
