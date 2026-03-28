<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\WatchHistory\StoreWatchHistoryRequest;
use App\Http\Resources\ContinueWatchingResource;
use App\Http\Resources\WatchHistoryResource;
use App\Services\WatchHistoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WatchHistoryController extends Controller
{
    public function __construct(private readonly WatchHistoryService $watchHistoryService) {}

    public function store(StoreWatchHistoryRequest $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;
        $record = $this->watchHistoryService->upsert($userId, $request->validated());

        return response()->json([
            'success' => true,
            'data'    => new WatchHistoryResource($record),
        ]);
    }

    public function show(string $contentId, Request $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;
        $episodeId = $request->query('episode_id');

        $record = $this->watchHistoryService->getProgress($userId, $contentId, $episodeId);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Watch history not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new WatchHistoryResource($record),
        ]);
    }

    public function continueWatching(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->_id;
        $records = $this->watchHistoryService->continueWatching($userId);

        return response()->json([
            'success' => true,
            'data'    => ContinueWatchingResource::collection($records),
        ]);
    }
}
