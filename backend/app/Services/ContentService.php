<?php

namespace App\Services;

use App\Models\Content;
use App\Models\Episode;
use App\Models\Season;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ContentService
{
    public function listAdmin(array $filters = []): LengthAwarePaginator
    {
        $query = Content::query();

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . preg_quote($filters['search'], '/') . '%');
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    public function listPublic(array $filters = []): LengthAwarePaginator
    {
        $query = Content::where('is_published', true);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['genre_id'])) {
            $query->where('genre_ids', $filters['genre_id']);
        }

        if (!empty($filters['language'])) {
            $query->where('language', $filters['language']);
        }

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . preg_quote($filters['search'], '/') . '%');
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    public function languages(): array
    {
        $languages = Content::raw(function ($collection) {
            return $collection->distinct('language', [
                'is_published' => true,
                'language' => ['$ne' => null],
            ]);
        });

        sort($languages);

        return $languages;
    }

    public function trending(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Content::where('is_published', true)
            ->orderBy('view_count', 'desc')
            ->limit($limit)
            ->get();
    }

    public function newReleases(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Content::where('is_published', true)
            ->whereNotNull('published_at')
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function store(array $data): Content
    {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
        $data = $this->buildVideoField($data);

        return Content::create($data);
    }

    public function update(Content $content, array $data): Content
    {
        if (isset($data['title']) && $data['title'] !== $content->title) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], (string) $content->_id);
        }

        $data = $this->buildVideoField($data);

        $content->update($data);
        $content->refresh();

        return $content;
    }

    public function togglePublish(Content $content): Content
    {
        $isPublishing = !$content->is_published;

        $content->update([
            'is_published' => $isPublishing,
            'published_at' => $isPublishing ? now() : $content->published_at,
        ]);

        $content->refresh();

        return $content;
    }

    public function destroy(Content $content): void
    {
        $contentId = (string) $content->_id;

        Episode::where('content_id', $contentId)->delete();
        Season::where('content_id', $contentId)->delete();
        $content->delete();
    }

    public function stats(): array
    {
        $total = Content::count();
        $published = Content::where('is_published', true)->count();
        $featured = Content::where('is_featured', true)->count();
        $totalViews = (int) Content::sum('view_count');
        $totalSeasons = Season::count();
        $totalEpisodes = Episode::count();
        $videosReady = Content::where('video.status', 'ready')->count();

        $recentContent = Content::orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['title', 'slug', 'type', 'is_published', 'view_count', 'poster_url', 'created_at']);

        $topContent = Content::where('is_published', true)
            ->orderBy('view_count', 'desc')
            ->limit(5)
            ->get(['title', 'slug', 'type', 'view_count', 'poster_url']);

        return [
            'total_content'  => $total,
            'published'      => $published,
            'unpublished'    => $total - $published,
            'movies'         => Content::where('type', 'movie')->count(),
            'series'         => Content::where('type', 'series')->count(),
            'featured'       => $featured,
            'total_views'    => $totalViews,
            'total_seasons'  => $totalSeasons,
            'total_episodes' => $totalEpisodes,
            'videos_ready'   => $videosReady,
            'recent_content' => $recentContent,
            'top_content'    => $topContent,
        ];
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

    private function generateUniqueSlug(string $title, ?string $excludeId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 1;
        $maxAttempts = 100;

        while ($counter <= $maxAttempts) {
            $query = Content::where('slug', $slug);
            if ($excludeId) {
                $query->where('_id', '!=', $excludeId);
            }
            if (!$query->exists()) {
                return $slug;
            }
            $slug = $base . '-' . $counter++;
        }

        return $base . '-' . \Illuminate\Support\Str::random(6);
    }
}
