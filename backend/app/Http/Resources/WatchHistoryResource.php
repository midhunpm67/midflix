<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WatchHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => (string) $this->_id,
            'content_id'       => $this->content_id,
            'episode_id'       => $this->episode_id,
            'progress_seconds' => $this->progress_seconds,
            'duration_seconds' => $this->duration_seconds,
            'completed'        => $this->completed,
            'updated_at'       => $this->updated_at?->toIso8601String(),
        ];
    }
}
