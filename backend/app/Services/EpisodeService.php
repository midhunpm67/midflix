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
        return Episode::create($data);
    }

    public function update(Episode $episode, array $data): Episode
    {
        $episode->update($data);
        $episode->refresh();
        return $episode;
    }

    public function destroy(Episode $episode): void
    {
        $episode->delete();
    }
}
