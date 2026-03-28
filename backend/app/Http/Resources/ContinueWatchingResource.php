<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ContinueWatchingResource extends WatchHistoryResource
{
    public function toArray(Request $request): array
    {
        $base = parent::toArray($request);

        $content = $this->contentLookup ?? null;

        $base['content'] = $content ? [
            'title'        => $content->title,
            'slug'         => $content->slug,
            'type'         => $content->type,
            'poster_url'   => $content->poster_url,
            'backdrop_url' => $content->backdrop_url,
        ] : null;

        return $base;
    }
}
