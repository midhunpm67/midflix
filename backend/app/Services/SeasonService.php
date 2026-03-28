<?php

namespace App\Services;

use App\Models\Episode;
use App\Models\Season;

class SeasonService
{
    public function store(string $contentId, array $data): Season
    {
        $data['content_id'] = (string) $contentId;
        return Season::create($data);
    }

    public function update(Season $season, array $data): Season
    {
        $season->update($data);
        $season->refresh();
        return $season;
    }

    public function destroy(Season $season): void
    {
        Episode::where('season_id', (string) $season->_id)->delete();
        $season->delete();
    }
}
