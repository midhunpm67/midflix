<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreEpisodeRequest;
use App\Http\Requests\Content\UpdateEpisodeRequest;
use App\Http\Resources\EpisodeResource;
use App\Models\Episode;
use App\Models\Season;
use App\Services\EpisodeService;
use Illuminate\Http\JsonResponse;

class EpisodeController extends Controller
{
    public function __construct(private readonly EpisodeService $episodeService) {}

    public function store(StoreEpisodeRequest $request, string $seasonId): JsonResponse
    {
        $season = Season::findOrFail($seasonId);
        $episode = $this->episodeService->store($season, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new EpisodeResource($episode),
            'message' => 'Episode created successfully',
        ], 201);
    }

    public function update(UpdateEpisodeRequest $request, string $id): JsonResponse
    {
        $episode = Episode::findOrFail($id);
        $updated = $this->episodeService->update($episode, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new EpisodeResource($updated),
            'message' => 'Episode updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $episode = Episode::findOrFail($id);
        $this->episodeService->destroy($episode);

        return response()->json([
            'success' => true,
            'message' => 'Episode deleted successfully',
        ]);
    }

    public function indexForSeason(Season $season): JsonResponse
    {
        $episodes = Episode::where('season_id', (string) $season->_id)
            ->orderBy('number')
            ->get();
        return response()->json(['data' => EpisodeResource::collection($episodes)]);
    }
}
