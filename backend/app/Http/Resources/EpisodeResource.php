<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpisodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => (string) $this->_id,
            'season_id'     => (string) $this->season_id,
            'content_id'    => (string) $this->content_id,
            'number'        => $this->number,
            'title'         => $this->title,
            'description'   => $this->description,
            'duration'      => $this->duration,
            'thumbnail_url' => $this->thumbnail_url,
            'video'         => $this->video,
            'created_at'    => $this->created_at?->toIso8601String(),
            'updated_at'    => $this->updated_at?->toIso8601String(),
        ];
    }
}
