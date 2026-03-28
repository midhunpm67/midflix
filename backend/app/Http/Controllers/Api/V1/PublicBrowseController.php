<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\EpisodeResource;
use App\Http\Resources\SeasonResource;
use App\Models\Content;
use App\Models\Episode;
use App\Models\Season;
use Illuminate\Http\JsonResponse;

class PublicBrowseController extends Controller
{
    public function seasons(string $slug): JsonResponse
    {
        $content = Content::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $seasons = Season::where('content_id', (string) $content->_id)
            ->orderBy('number')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => SeasonResource::collection($seasons),
        ]);
    }

    public function episodes(string $id): JsonResponse
    {
        $season = Season::findOrFail($id);

        $episodes = Episode::where('season_id', (string) $season->_id)
            ->orderBy('number')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => EpisodeResource::collection($episodes),
        ]);
    }
}
