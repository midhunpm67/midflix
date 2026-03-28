<?php

namespace App\Services;

use App\Models\Content;
use App\Models\WatchHistory;

class WatchHistoryService
{
    private const COMPLETION_THRESHOLD = 0.9;

    public function upsert(string $userId, array $data): WatchHistory
    {
        $record = WatchHistory::updateOrCreate(
            [
                'user_id'    => $userId,
                'content_id' => $data['content_id'],
                'episode_id' => $data['episode_id'] ?? null,
            ],
            [
                'progress_seconds' => $data['progress_seconds'],
                'duration_seconds' => $data['duration_seconds'],
                'completed'        => $data['progress_seconds'] >= $data['duration_seconds'] * self::COMPLETION_THRESHOLD,
            ]
        );

        return $record;
    }

    public function getProgress(string $userId, string $contentId, ?string $episodeId = null): ?WatchHistory
    {
        return WatchHistory::where('user_id', $userId)
            ->where('content_id', $contentId)
            ->where('episode_id', $episodeId)
            ->first();
    }

    public function continueWatching(string $userId, int $limit = 10): array
    {
        $records = WatchHistory::where('user_id', $userId)
            ->where('completed', false)
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();

        $contentIds = $records->pluck('content_id')->unique()->values()->all();
        $contentMap = Content::whereIn('_id', $contentIds)
            ->get()
            ->keyBy(fn ($c) => (string) $c->_id);

        return $records->map(function ($record) use ($contentMap) {
            $record->contentLookup = $contentMap->get($record->content_id);
            return $record;
        })->all();
    }
}
