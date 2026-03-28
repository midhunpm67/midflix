<?php

namespace App\Services;

use App\Models\Episode;
use App\Models\Season;

class EpisodeService
{
    public function store(Season $season, array $data): Episode
    {
        $data['season_id'] = (string) $season->_id;
        $data['content_id'] = $season->content_id;
        $data = $this->buildVideoField($data);
        return Episode::create($data);
    }

    public function update(Episode $episode, array $data): Episode
    {
        $data = $this->buildVideoField($data);
        $episode->update($data);
        $episode->refresh();
        return $episode;
    }

    public function destroy(Episode $episode): void
    {
        $episode->delete();
    }

    private function buildVideoField(array $data): array
    {
        if (is_array($data['video'] ?? null) && array_key_exists('playback_id', $data['video'])) {
            $playbackId = $data['video']['playback_id'];
            $data['video'] = [
                'playback_id' => $playbackId ?: null,
                'status' => $playbackId ? 'ready' : 'pending',
            ];
        }
        return $data;
    }
}
