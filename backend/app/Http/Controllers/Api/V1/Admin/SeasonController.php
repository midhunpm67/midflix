<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreSeasonRequest;
use App\Http\Requests\Content\UpdateSeasonRequest;
use App\Http\Resources\SeasonResource;
use App\Models\Content;
use App\Models\Season;
use App\Services\SeasonService;
use Illuminate\Http\JsonResponse;

class SeasonController extends Controller
{
    public function __construct(private readonly SeasonService $seasonService) {}

    public function store(StoreSeasonRequest $request, string $contentId): JsonResponse
    {
        Content::findOrFail($contentId);
        $season = $this->seasonService->store($contentId, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new SeasonResource($season),
            'message' => 'Season created successfully',
        ], 201);
    }

    public function update(UpdateSeasonRequest $request, string $id): JsonResponse
    {
        $season = Season::findOrFail($id);
        $updated = $this->seasonService->update($season, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new SeasonResource($updated),
            'message' => 'Season updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $season = Season::findOrFail($id);
        $this->seasonService->destroy($season);

        return response()->json([
            'success' => true,
            'message' => 'Season deleted successfully',
        ]);
    }

    public function indexForContent(Content $content): JsonResponse
    {
        $seasons = Season::where('content_id', (string) $content->_id)
            ->orderBy('number')
            ->get();
        return response()->json(['data' => SeasonResource::collection($seasons)]);
    }
}
