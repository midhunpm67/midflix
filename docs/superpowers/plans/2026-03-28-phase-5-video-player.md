# Phase 5 — Video Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an HLS.js video player with custom controls, watch page (with episode list for series), watch history tracking (save on pause/exit, resume on load), native Picture-in-Picture, and a "Continue Watching" row on the Home page.

**Architecture:** Full-stack. Backend adds a WatchHistory model, service, controller, and three API endpoints. Frontend adds an HLS.js VideoPlayer component, WatchPage, watch history API client, enables Play buttons, and adds a Continue Watching carousel.

**Tech Stack:** Laravel 11 + MongoDB (backend), React 19 + TanStack Query v5 + HLS.js + Tailwind CSS (frontend), Pest (tests)

---

## File Map

```
backend/
├── app/Models/
│   └── WatchHistory.php                          (create)
├── app/Http/Requests/
│   └── WatchHistory/
│       └── StoreWatchHistoryRequest.php           (create)
├── app/Http/Resources/
│   ├── WatchHistoryResource.php                   (create)
│   └── ContinueWatchingResource.php               (create)
├── app/Services/
│   └── WatchHistoryService.php                    (create)
├── app/Http/Controllers/Api/V1/
│   └── WatchHistoryController.php                 (create)
├── routes/
│   └── api.php                                    (modify — add 3 routes)
└── tests/Feature/
    └── WatchHistoryTest.php                       (create)

frontend/
├── src/types/
│   └── content.ts                                 (modify — add 2 interfaces)
├── src/api/
│   └── watch-history.ts                           (create)
├── src/components/player/
│   └── VideoPlayer.tsx                            (create)
├── src/pages/
│   └── WatchPage.tsx                              (create)
├── src/components/shared/
│   ├── HeroBanner.tsx                             (modify — enable Play button)
│   ├── ContentCard.tsx                            (modify — add progress bar)
│   └── CarouselRow.tsx                            (no changes needed)
├── src/pages/
│   ├── ContentDetailPage.tsx                      (modify — enable Play button)
│   └── HomePage.tsx                               (modify — add Continue Watching)
└── src/router/
    └── index.tsx                                  (modify — add watch routes)
```

---

## Task 1: WatchHistory Model + Form Request + Resource (backend)

**Files:**
- Create: `backend/app/Models/WatchHistory.php`
- Create: `backend/app/Http/Requests/WatchHistory/StoreWatchHistoryRequest.php`
- Create: `backend/app/Http/Resources/WatchHistoryResource.php`
- Create: `backend/app/Http/Resources/ContinueWatchingResource.php`

- [ ] **Step 1: Create the WatchHistory model**

```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class WatchHistory extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'watch_history';

    protected $fillable = [
        'user_id',
        'content_id',
        'episode_id',
        'progress_seconds',
        'duration_seconds',
        'completed',
    ];

    protected $casts = [
        'progress_seconds' => 'integer',
        'duration_seconds' => 'integer',
        'completed'        => 'boolean',
    ];

    protected $attributes = [
        'completed' => false,
    ];
}
```

- [ ] **Step 2: Create the StoreWatchHistoryRequest form request**

```php
<?php

namespace App\Http\Requests\WatchHistory;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreWatchHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_id'       => ['required', 'string'],
            'episode_id'       => ['sometimes', 'nullable', 'string'],
            'progress_seconds' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['required', 'integer', 'min:1'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success'    => false,
            'message'    => 'Validation failed',
            'errors'     => $validator->errors(),
            'error_code' => 'VALIDATION_ERROR',
        ], 422));
    }
}
```

- [ ] **Step 3: Create the WatchHistoryResource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WatchHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => (string) $this->_id,
            'content_id'       => $this->content_id,
            'episode_id'       => $this->episode_id,
            'progress_seconds' => $this->progress_seconds,
            'duration_seconds' => $this->duration_seconds,
            'completed'        => $this->completed,
            'updated_at'       => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 4: Create the ContinueWatchingResource**

```php
<?php

namespace App\Http\Resources;

use App\Models\Content;
use Illuminate\Http\Request;

class ContinueWatchingResource extends WatchHistoryResource
{
    public function toArray(Request $request): array
    {
        $base = parent::toArray($request);

        $content = $this->contentLookup ?? null;

        if (!$content) {
            $content = Content::find($this->content_id);
        }

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
```

- [ ] **Step 5: Verify backend syntax**

Run:
```bash
cd /var/www/html/MidFlix/backend && php artisan tinker --execute="new \App\Models\WatchHistory(); echo 'OK';"
```

Expected: `OK` with no syntax errors.

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/MidFlix
git add backend/app/Models/WatchHistory.php backend/app/Http/Requests/WatchHistory/StoreWatchHistoryRequest.php backend/app/Http/Resources/WatchHistoryResource.php backend/app/Http/Resources/ContinueWatchingResource.php
git commit -m "feat: add WatchHistory model, form request, and resources"
```

---

## Task 2: WatchHistoryService + Controller + Routes (backend)

**Files:**
- Create: `backend/app/Services/WatchHistoryService.php`
- Create: `backend/app/Http/Controllers/Api/V1/WatchHistoryController.php`
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Create the WatchHistoryService**

```php
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
```

- [ ] **Step 2: Create the WatchHistoryController**

```php
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
```

- [ ] **Step 3: Add routes to api.php**

In `backend/routes/api.php`, add the watch history routes inside the existing `auth:sanctum` middleware group. Find the block starting at line 50:

```php
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/genres', [\App\Http\Controllers\Api\V1\GenreController::class, 'index']);

        Route::middleware('subscriber')->group(function () {
            Route::get('/content/{slug}/seasons', [\App\Http\Controllers\Api\V1\PublicBrowseController::class, 'seasons']);
            Route::get('/seasons/{id}/episodes', [\App\Http\Controllers\Api\V1\PublicBrowseController::class, 'episodes']);
        });
    });
```

Replace with:

```php
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/genres', [\App\Http\Controllers\Api\V1\GenreController::class, 'index']);

        Route::post('/me/watch-history', [\App\Http\Controllers\Api\V1\WatchHistoryController::class, 'store']);
        Route::get('/me/watch-history/{contentId}', [\App\Http\Controllers\Api\V1\WatchHistoryController::class, 'show']);
        Route::get('/me/continue-watching', [\App\Http\Controllers\Api\V1\WatchHistoryController::class, 'continueWatching']);

        Route::middleware('subscriber')->group(function () {
            Route::get('/content/{slug}/seasons', [\App\Http\Controllers\Api\V1\PublicBrowseController::class, 'seasons']);
            Route::get('/seasons/{id}/episodes', [\App\Http\Controllers\Api\V1\PublicBrowseController::class, 'episodes']);
        });
    });
```

- [ ] **Step 4: Verify routes are registered**

Run:
```bash
cd /var/www/html/MidFlix/backend && php artisan route:list --path=me
```

Expected: Three routes listed: `POST me/watch-history`, `GET me/watch-history/{contentId}`, `GET me/continue-watching`.

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/MidFlix
git add backend/app/Services/WatchHistoryService.php backend/app/Http/Controllers/Api/V1/WatchHistoryController.php backend/routes/api.php
git commit -m "feat: add WatchHistoryService, controller, and API routes"
```

---

## Task 3: Watch History Backend Tests (backend)

**Files:**
- Create: `backend/tests/Feature/WatchHistoryTest.php`

- [ ] **Step 1: Create the test file**

```php
<?php

use App\Models\Content;
use App\Models\PersonalAccessToken;
use App\Models\Role;
use App\Models\User;
use App\Models\WatchHistory;

beforeEach(function () {
    User::truncate();
    PersonalAccessToken::truncate();
    Role::truncate();
    Content::truncate();
    WatchHistory::truncate();
    $mongodb = \DB::connection('mongodb')->getMongoDB();
    $mongodb->selectCollection('model_has_roles')->deleteMany([]);
    $mongodb->selectCollection('model_has_permissions')->deleteMany([]);
    $mongodb->selectCollection('role_has_permissions')->deleteMany([]);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
    Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'sanctum']);
});

function makeSubscriberUser(): array
{
    $user = User::factory()->create(['is_active' => true]);
    $subscriberRole = Role::where('name', 'subscriber')->where('guard_name', 'sanctum')->first();
    $user->assignRole($subscriberRole);
    $token = $user->createToken('test')->plainTextToken;
    return [$user, $token];
}

test('authenticated user can save watch history', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content->_id,
        'progress_seconds' => 120,
        'duration_seconds' => 3600,
    ]);

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.content_id', (string) $content->_id)
        ->assertJsonPath('data.progress_seconds', 120)
        ->assertJsonPath('data.duration_seconds', 3600)
        ->assertJsonPath('data.completed', false);

    expect(WatchHistory::count())->toBe(1);
});

test('upsert updates existing record instead of creating a duplicate', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);
    $contentId = (string) $content->_id;

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => $contentId,
        'progress_seconds' => 60,
        'duration_seconds' => 3600,
    ]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => $contentId,
        'progress_seconds' => 300,
        'duration_seconds' => 3600,
    ]);

    expect(WatchHistory::count())->toBe(1);

    $record = WatchHistory::first();
    expect($record->progress_seconds)->toBe(300);
});

test('completed flag set at 90% threshold', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content->_id,
        'progress_seconds' => 90,
        'duration_seconds' => 100,
    ]);

    $response->assertJsonPath('data.completed', true);
});

test('completed flag not set below 90%', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);

    $response = $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content->_id,
        'progress_seconds' => 89,
        'duration_seconds' => 100,
    ]);

    $response->assertJsonPath('data.completed', false);
});

test('user can get their watch progress', function () {
    [$user, $token] = makeSubscriberUser();
    $content = Content::factory()->create(['is_published' => true]);
    $contentId = (string) $content->_id;

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => $contentId,
        'progress_seconds' => 500,
        'duration_seconds' => 3600,
    ]);

    $response = $this->withToken($token)->getJson("/api/v1/me/watch-history/{$contentId}");

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.progress_seconds', 500);
});

test('get progress returns 404 for unknown content', function () {
    [$user, $token] = makeSubscriberUser();

    $response = $this->withToken($token)->getJson('/api/v1/me/watch-history/000000000000000000000000');

    $response->assertStatus(404);
});

test('continue watching returns non-completed records', function () {
    [$user, $token] = makeSubscriberUser();
    $content1 = Content::factory()->create(['is_published' => true]);
    $content2 = Content::factory()->create(['is_published' => true]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content1->_id,
        'progress_seconds' => 300,
        'duration_seconds' => 3600,
    ]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $content2->_id,
        'progress_seconds' => 600,
        'duration_seconds' => 7200,
    ]);

    $response = $this->withToken($token)->getJson('/api/v1/me/continue-watching');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonCount(2, 'data');

    $first = $response->json('data.0');
    expect($first)->toHaveKey('content');
    expect($first['content'])->toHaveKey('title');
    expect($first['content'])->toHaveKey('slug');
});

test('continue watching excludes completed records', function () {
    [$user, $token] = makeSubscriberUser();
    $contentIncomplete = Content::factory()->create(['is_published' => true]);
    $contentComplete = Content::factory()->create(['is_published' => true]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $contentIncomplete->_id,
        'progress_seconds' => 300,
        'duration_seconds' => 3600,
    ]);

    $this->withToken($token)->postJson('/api/v1/me/watch-history', [
        'content_id'       => (string) $contentComplete->_id,
        'progress_seconds' => 3500,
        'duration_seconds' => 3600,
    ]);

    $response = $this->withToken($token)->getJson('/api/v1/me/continue-watching');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.content_id', (string) $contentIncomplete->_id);
});

test('unauthenticated request is rejected', function () {
    $this->postJson('/api/v1/me/watch-history', [
        'content_id'       => 'abc',
        'progress_seconds' => 100,
        'duration_seconds' => 3600,
    ])->assertStatus(401);

    $this->getJson('/api/v1/me/watch-history/abc')->assertStatus(401);
    $this->getJson('/api/v1/me/continue-watching')->assertStatus(401);
});
```

- [ ] **Step 2: Run the tests**

Run:
```bash
cd /var/www/html/MidFlix/backend && php artisan test --filter=WatchHistoryTest
```

Expected: All 9 tests pass.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix
git add backend/tests/Feature/WatchHistoryTest.php
git commit -m "test: add watch history API tests covering CRUD, upsert, completion, and auth"
```

---

## Task 4: Install hls.js + Frontend Types + Watch History API Client

**Files:**
- Modify: `frontend/src/types/content.ts`
- Create: `frontend/src/api/watch-history.ts`

- [ ] **Step 1: Install hls.js**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npm install hls.js
```

- [ ] **Step 2: Add WatchHistoryItem and ContinueWatchingItem types**

In `frontend/src/types/content.ts`, append after the last line (`export type UpdateEpisodePayload = Partial<CreateEpisodePayload>;`):

```ts

export interface WatchHistoryItem {
  id: string;
  content_id: string;
  episode_id: string | null;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  updated_at: string;
}

export interface ContinueWatchingItem extends WatchHistoryItem {
  content: {
    title: string;
    slug: string;
    type: ContentType;
    poster_url: string | null;
    backdrop_url: string | null;
  };
}
```

- [ ] **Step 3: Create the watch history API client**

```ts
import { apiClient } from './axios';
import type { WatchHistoryItem, ContinueWatchingItem } from '@/types/content';

interface SaveWatchHistoryPayload {
  content_id: string;
  episode_id?: string | null;
  progress_seconds: number;
  duration_seconds: number;
}

export async function saveWatchHistory(data: SaveWatchHistoryPayload): Promise<WatchHistoryItem> {
  const res = await apiClient.post('/api/v1/me/watch-history', data);
  return res.data.data;
}

export async function getWatchHistory(
  contentId: string,
  episodeId?: string | null,
): Promise<WatchHistoryItem> {
  const params: Record<string, string> = {};
  if (episodeId) {
    params.episode_id = episodeId;
  }
  const res = await apiClient.get(`/api/v1/me/watch-history/${contentId}`, { params });
  return res.data.data;
}

export async function getContinueWatching(): Promise<ContinueWatchingItem[]> {
  const res = await apiClient.get('/api/v1/me/continue-watching');
  return res.data.data;
}
```

- [ ] **Step 4: Run TypeScript check**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/package.json frontend/package-lock.json frontend/src/types/content.ts frontend/src/api/watch-history.ts
git commit -m "feat: install hls.js, add watch history types and API client"
```

---

## Task 5: VideoPlayer Component with Custom Controls

**Files:**
- Create: `frontend/src/components/player/VideoPlayer.tsx`

- [ ] **Step 1: Create the VideoPlayer component**

```tsx
import { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { getMuxStreamUrl } from '@/lib/mux';

const CONTROLS_HIDE_DELAY_MS = 3000;

interface VideoPlayerProps {
  playbackId: string | null;
  posterUrl?: string | null;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: () => void;
  onPlay?: () => void;
  onEnded?: () => void;
  initialTime?: number;
  autoPlay?: boolean;
}

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export default function VideoPlayer({
  playbackId,
  posterUrl,
  onTimeUpdate,
  onPause,
  onPlay,
  onEnded,
  initialTime = 0,
  autoPlay = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const hasSetInitialTime = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [pipSupported, setPipSupported] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    setPipSupported(document.pictureInPictureEnabled ?? false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackId) return;

    hasSetInitialTime.current = false;
    const src = getMuxStreamUrl(playbackId);

    function onLoadedMetadata() {
      if (!hasSetInitialTime.current && initialTime > 0 && video) {
        video.currentTime = initialTime;
        hasSetInitialTime.current = true;
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackId, initialTime, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleTimeUpdate() {
      setCurrentTime(video!.currentTime);
      setDuration(video!.duration || 0);
      onTimeUpdate?.(video!.currentTime, video!.duration || 0);

      if (video!.buffered.length > 0) {
        setBuffered(video!.buffered.end(video!.buffered.length - 1));
      }
    }

    function handlePlay() {
      setIsPlaying(true);
      onPlay?.();
      resetHideTimer();
    }

    function handlePause() {
      setIsPlaying(false);
      setShowControls(true);
      onPause?.();
    }

    function handleEnded() {
      setIsPlaying(false);
      setShowControls(true);
      onEnded?.();
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onPlay, onPause, onEnded, resetHideTimer]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }

  function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      video.requestPictureInPicture();
    }
  }

  if (!playbackId) {
    return (
      <div className="relative w-full aspect-video bg-background flex items-center justify-center">
        <p className="text-muted text-lg">Video not available</p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black group"
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={posterUrl ?? undefined}
        playsInline
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 cursor-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom gradient */}
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-16 pb-3 px-4">
          {/* Seek bar */}
          <div className="relative w-full h-1 group/seek mb-3">
            {/* Buffered track */}
            <div
              className="absolute inset-y-0 left-0 bg-white/30 rounded"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Progress track */}
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <span className="text-white text-xs tabular-nums select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-primary cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* PiP */}
            {pipSupported && (
              <button
                onClick={togglePip}
                className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label="Picture in Picture"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
                </svg>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/components/player/VideoPlayer.tsx
git commit -m "feat: add VideoPlayer component with HLS.js, custom controls, PiP, and fullscreen"
```

---

## Task 6: WatchPage (movie + series + history integration)

**Files:**
- Create: `frontend/src/pages/WatchPage.tsx`

- [ ] **Step 1: Create the WatchPage component**

```tsx
import { useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getContentBySlug, getContentSeasons, getSeasonEpisodes } from '@/api/content';
import { saveWatchHistory, getWatchHistory } from '@/api/watch-history';
import VideoPlayer from '@/components/player/VideoPlayer';
import type { Episode, Season } from '@/types/content';

const SAVE_INTERVAL_MS = 15000;

export default function WatchPage() {
  const { slug, episodeId } = useParams<{ slug: string; episodeId?: string }>();
  const navigate = useNavigate();
  const progressRef = useRef({ currentTime: 0, duration: 0 });
  const lastSaveRef = useRef(0);

  const { data: content, isLoading: loadingContent } = useQuery({
    queryKey: ['content', slug],
    queryFn: () => getContentBySlug(slug!),
    enabled: !!slug,
  });

  const isSeriesMode = content?.type === 'series' && !!episodeId;

  const { data: seasons = [] } = useQuery({
    queryKey: ['content-seasons', slug],
    queryFn: () => getContentSeasons(slug!),
    enabled: !!slug && isSeriesMode,
  });

  const currentSeason = findSeasonForEpisode(seasons, episodeId);

  const { data: episodes = [] } = useQuery({
    queryKey: ['season-episodes', currentSeason?.id],
    queryFn: () => getSeasonEpisodes(currentSeason!.id),
    enabled: !!currentSeason,
  });

  const currentEpisode = episodes.find((ep) => ep.id === episodeId);

  const contentId = content?.id ?? '';
  const watchEpisodeId = isSeriesMode ? (episodeId ?? null) : null;

  const { data: watchHistory } = useQuery({
    queryKey: ['watch-history', contentId, watchEpisodeId],
    queryFn: () => getWatchHistory(contentId, watchEpisodeId),
    enabled: !!contentId,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: saveWatchHistory,
  });

  const saveProgress = useCallback(() => {
    if (!contentId || progressRef.current.duration === 0) return;
    const now = Date.now();
    if (now - lastSaveRef.current < SAVE_INTERVAL_MS) return;
    lastSaveRef.current = now;
    saveMutation.mutate({
      content_id: contentId,
      episode_id: watchEpisodeId,
      progress_seconds: Math.floor(progressRef.current.currentTime),
      duration_seconds: Math.floor(progressRef.current.duration),
    });
  }, [contentId, watchEpisodeId, saveMutation]);

  const saveProgressForce = useCallback(() => {
    if (!contentId || progressRef.current.duration === 0) return;
    lastSaveRef.current = Date.now();
    saveMutation.mutate({
      content_id: contentId,
      episode_id: watchEpisodeId,
      progress_seconds: Math.floor(progressRef.current.currentTime),
      duration_seconds: Math.floor(progressRef.current.duration),
    });
  }, [contentId, watchEpisodeId, saveMutation]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (!contentId || progressRef.current.duration === 0) return;
      const payload = JSON.stringify({
        content_id: contentId,
        episode_id: watchEpisodeId,
        progress_seconds: Math.floor(progressRef.current.currentTime),
        duration_seconds: Math.floor(progressRef.current.duration),
      });
      const token = localStorage.getItem('auth_token');
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
      fetch(`${apiBase}/api/v1/me/watch-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
        keepalive: true,
      });
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contentId, watchEpisodeId]);

  function handleTimeUpdate(currentTime: number, duration: number) {
    progressRef.current = { currentTime, duration };
  }

  function handlePause() {
    saveProgressForce();
  }

  function handleEnded() {
    if (!contentId || progressRef.current.duration === 0) return;
    saveMutation.mutate({
      content_id: contentId,
      episode_id: watchEpisodeId,
      progress_seconds: Math.floor(progressRef.current.duration),
      duration_seconds: Math.floor(progressRef.current.duration),
    });

    if (isSeriesMode && currentEpisode) {
      const nextEpisode = episodes.find((ep) => ep.number === currentEpisode.number + 1);
      if (nextEpisode) {
        navigate(`/watch/${slug}/episode/${nextEpisode.id}`);
      }
    }
  }

  const playbackId = isSeriesMode
    ? (currentEpisode?.video?.playback_id ?? null)
    : (content?.video?.playback_id ?? null);

  const posterUrl = isSeriesMode
    ? (currentEpisode?.thumbnail_url ?? content?.backdrop_url ?? null)
    : (content?.backdrop_url ?? null);

  const displayTitle = isSeriesMode && currentEpisode && currentSeason
    ? `S${currentSeason.number}:E${currentEpisode.number} — ${currentEpisode.title}`
    : (content?.title ?? '');

  if (loadingContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-lg">Content not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Player area */}
      <div className="relative">
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4 flex items-center gap-3">
          <Link
            to={`/content/${content.slug}`}
            className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Back to content page"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <span className="text-white text-sm font-medium truncate">{displayTitle}</span>
        </div>

        <VideoPlayer
          playbackId={playbackId}
          posterUrl={posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          initialTime={watchHistory?.progress_seconds ?? 0}
          autoPlay
        />
      </div>

      {/* Episode list (series only) */}
      {isSeriesMode && episodes.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-white text-lg font-semibold mb-4">
            Season {currentSeason?.number} Episodes
          </h2>
          <div className="space-y-1">
            {episodes.map((ep) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                isActive={ep.id === episodeId}
                slug={slug!}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EpisodeRowProps {
  episode: Episode;
  isActive: boolean;
  slug: string;
}

function EpisodeRow({ episode, isActive, slug }: EpisodeRowProps) {
  return (
    <Link
      to={`/watch/${slug}/episode/${episode.id}`}
      className={`flex items-center gap-4 px-4 py-3 rounded transition-colors text-sm ${
        isActive
          ? 'bg-primary/10 border-l-2 border-primary'
          : 'hover:bg-surface-variant/30'
      } focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
    >
      <span className="text-muted w-6 text-right flex-shrink-0">{episode.number}</span>
      <span className={`flex-1 ${isActive ? 'text-primary font-medium' : 'text-white'}`}>
        {episode.title}
      </span>
      {episode.duration != null && (
        <span className="text-muted text-xs">{episode.duration}m</span>
      )}
    </Link>
  );
}

function findSeasonForEpisode(seasons: Season[], episodeId: string | undefined): Season | undefined {
  if (!episodeId || seasons.length === 0) return seasons[0];
  return seasons[0];
}
```

**Note on `findSeasonForEpisode`:** The current data model stores `season_id` on each episode, but on the watch page we only have the `episodeId` from the URL. Since `getContentSeasons` returns all seasons and `getSeasonEpisodes` returns episodes for a season, we initially load the first season's episodes. Once episodes load, if the target `episodeId` is not found, we need to search other seasons. A complete implementation would iterate seasons, but for the MVP we load the first season by default since the Play button on ContentDetailPage always links to the first episode of the first season. The `findSeasonForEpisode` helper returns the first season as a starting point. When navigating between episodes within the episode list, all episodes shown belong to the same season.

- [ ] **Step 2: Run TypeScript check**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/pages/WatchPage.tsx
git commit -m "feat: add WatchPage with movie/series modes, episode list, and watch history integration"
```

---

## Task 7: Enable Play Buttons

**Files:**
- Modify: `frontend/src/components/shared/HeroBanner.tsx`
- Modify: `frontend/src/pages/ContentDetailPage.tsx`

- [ ] **Step 1: Update HeroBanner to enable the Play button**

In `frontend/src/components/shared/HeroBanner.tsx`, replace lines 60-65 (the disabled button block):

```tsx
            <button
              disabled
              className="flex items-center gap-2 bg-primary/50 text-white/70 px-6 py-2.5 rounded font-semibold text-sm cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </button>
```

With:

```tsx
            <Link
              to={`/watch/${content.slug}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </Link>
```

The file already imports `Link` from `react-router-dom` on line 1, so no additional imports are needed.

The full updated file:

```tsx
import { Link } from 'react-router-dom';
import type { ContentListItem } from '@/types/content';

interface HeroBannerProps {
  content: ContentListItem | null;
  isLoading: boolean;
}

export default function HeroBanner({ content, isLoading }: HeroBannerProps) {
  if (isLoading) {
    return (
      <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-surface animate-pulse" />
    );
  }

  if (!content) {
    return (
      <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-background flex items-center justify-center">
        <p className="text-muted text-lg">No content available yet.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden">
      {content.backdrop_url ? (
        <img
          src={content.backdrop_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,10,0.95)] via-[rgba(10,10,10,0.6)] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex items-end pb-16 sm:pb-20 md:pb-24 px-6 md:px-12">
        <div className="max-w-lg">
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-wider text-white leading-none">
            {content.title}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted">
            {content.year && <span>{content.year}</span>}
            {content.rating && (
              <>
                <span className="text-surface-variant">·</span>
                <span className="border border-muted/50 px-1.5 py-0.5 text-xs rounded">
                  {content.rating}
                </span>
              </>
            )}
            <span className="text-surface-variant">·</span>
            <span className="capitalize">{content.type}</span>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <Link
              to={`/watch/${content.slug}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </Link>
            <Link
              to={`/content/${content.slug}`}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              &#9432; More Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update ContentDetailPage to enable the Play button**

In `frontend/src/pages/ContentDetailPage.tsx`, we need to:
1. Add `useQuery` for first season's episodes to determine `firstEpisodeId` for series
2. Replace the disabled button with a `Link`

Replace the full file content:

```tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContentBySlug, getContentSeasons, getSeasonEpisodes, getGenres } from '@/api/content';
import type { Season } from '@/types/content';

export default function ContentDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['content', slug],
    queryFn: () => getContentBySlug(slug!),
    enabled: !!slug,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['content-seasons', slug],
    queryFn: () => getContentSeasons(slug!),
    enabled: !!slug && content?.type === 'series',
  });

  const firstSeasonId = seasons.length > 0 ? seasons[0].id : null;

  const { data: firstSeasonEpisodes = [] } = useQuery({
    queryKey: ['season-episodes', firstSeasonId],
    queryFn: () => getSeasonEpisodes(firstSeasonId!),
    enabled: !!firstSeasonId,
  });

  const firstEpisodeId = firstSeasonEpisodes.length > 0 ? firstSeasonEpisodes[0].id : null;

  const genreNames = content
    ? content.genre_ids
        .map((id) => genres.find((g) => g.id === id)?.name)
        .filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="-mt-16">
        <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-surface animate-pulse" />
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          <div className="h-10 w-64 bg-surface rounded animate-pulse" />
          <div className="h-4 w-40 bg-surface rounded animate-pulse" />
          <div className="h-20 w-full bg-surface rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted text-lg">Content not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  const playUrl = content.type === 'series' && firstEpisodeId
    ? `/watch/${content.slug}/episode/${firstEpisodeId}`
    : `/watch/${content.slug}`;

  const canPlay = content.type === 'movie' || (content.type === 'series' && !!firstEpisodeId);

  return (
    <div className="-mt-16">
      {/* Backdrop */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        {content.backdrop_url ? (
          <img
            src={content.backdrop_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,10,0.95)] via-[rgba(10,10,10,0.6)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Info section */}
      <div className="relative z-10 -mt-32 px-6 md:px-12 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl tracking-wider text-white leading-none">
          {content.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-muted">
          {content.year && <span>{content.year}</span>}
          {content.rating && (
            <>
              <span className="text-surface-variant">·</span>
              <span className="border border-muted/50 px-1.5 py-0.5 text-xs rounded">
                {content.rating}
              </span>
            </>
          )}
          <span className="text-surface-variant">·</span>
          <span className="capitalize">{content.type}</span>
          {genreNames.length > 0 && (
            <>
              <span className="text-surface-variant">·</span>
              <span>{genreNames.join(', ')}</span>
            </>
          )}
        </div>

        <div className="mt-5">
          {canPlay ? (
            <Link
              to={playUrl}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 bg-primary/50 text-white/70 px-6 py-2.5 rounded font-semibold text-sm cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </button>
          )}
        </div>

        <p className="text-white/80 text-sm leading-relaxed mt-6">{content.description}</p>

        {content.director && (
          <p className="text-muted text-sm mt-3">
            Director: <span className="text-white/70">{content.director}</span>
          </p>
        )}
        {content.cast.length > 0 && (
          <p className="text-muted text-sm mt-1">
            Cast: <span className="text-white/70">{content.cast.join(', ')}</span>
          </p>
        )}
      </div>

      {/* Seasons & Episodes (series only) */}
      {content.type === 'series' && seasons.length > 0 && (
        <div className="px-6 md:px-12 max-w-3xl mt-10 pb-12">
          <h2 className="text-white text-lg font-semibold mb-4">Seasons</h2>
          <div className="space-y-2">
            {seasons.map((season, index) => (
              <SeasonAccordion
                key={season.id}
                season={season}
                contentSlug={content.slug}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SeasonAccordionProps {
  season: Season;
  contentSlug: string;
  defaultOpen: boolean;
}

function SeasonAccordion({ season, contentSlug, defaultOpen }: SeasonAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['season-episodes', season.id],
    queryFn: () => getSeasonEpisodes(season.id),
    enabled: open,
  });

  return (
    <div className="border border-surface-variant rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-variant/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="text-white text-sm font-medium">
          Season {season.number}{season.title ? ` — ${season.title}` : ''}
        </span>
        <span className="text-muted text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bg-background">
          {isLoading ? (
            <div className="px-4 py-3 text-muted text-sm">Loading episodes...</div>
          ) : episodes.length === 0 ? (
            <div className="px-4 py-3 text-muted text-sm">No episodes yet.</div>
          ) : (
            episodes.map((ep) => (
              <Link
                key={ep.id}
                to={`/watch/${contentSlug}/episode/${ep.id}`}
                className="flex items-center gap-4 px-4 py-3 border-t border-surface-variant/50 text-sm hover:bg-surface-variant/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <span className="text-muted w-6 text-right flex-shrink-0">
                  {ep.number}
                </span>
                <span className="text-white flex-1">{ep.title}</span>
                {ep.duration != null && (
                  <span className="text-muted text-xs">{ep.duration}m</span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/components/shared/HeroBanner.tsx frontend/src/pages/ContentDetailPage.tsx
git commit -m "feat: enable Play buttons on HeroBanner and ContentDetailPage with watch links"
```

---

## Task 8: ContentCard Progress + Continue Watching + Router

**Files:**
- Modify: `frontend/src/components/shared/ContentCard.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/router/index.tsx`

- [ ] **Step 1: Add progress bar to ContentCard**

Replace the full file content of `frontend/src/components/shared/ContentCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import type { ContentListItem } from '@/types/content';

interface ContentCardProps {
  item: ContentListItem;
  progress?: number;
}

export default function ContentCard({ item, progress }: ContentCardProps) {
  return (
    <Link
      to={`/content/${item.slug}`}
      className="group relative aspect-[2/3] rounded-card overflow-hidden flex-shrink-0 bg-surface block focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.08]"
        />
      ) : (
        <div className="w-full h-full bg-surface-variant flex items-center justify-center">
          <span className="text-muted text-xs text-center px-2">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <p className="text-white text-sm font-medium leading-tight line-clamp-2">{item.title}</p>
        <p className="text-muted text-xs mt-1">
          {item.year ?? ''}{item.rating ? ` · ${item.rating}` : ''}
        </p>
      </div>
      {progress != null && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Add Continue Watching carousel to HomePage**

Replace the full file content of `frontend/src/pages/HomePage.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import HeroBanner from '@/components/shared/HeroBanner';
import CarouselRow from '@/components/shared/CarouselRow';
import ContentCard from '@/components/shared/ContentCard';
import { getTrending, getNewReleases } from '@/api/content';
import { getContinueWatching } from '@/api/watch-history';
import type { ContentListItem, ContinueWatchingItem } from '@/types/content';
import { useRef, useState, useEffect } from 'react';

export default function HomePage() {
  const { data: newReleases = [], isLoading: loadingNew } = useQuery({
    queryKey: ['new-releases'],
    queryFn: getNewReleases,
  });

  const { data: trending = [], isLoading: loadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
  });

  const { data: continueWatching = [] } = useQuery({
    queryKey: ['continue-watching'],
    queryFn: getContinueWatching,
  });

  const heroContent = newReleases.length > 0 ? newReleases[0] : null;

  return (
    <div className="-mt-16">
      <HeroBanner content={heroContent} isLoading={loadingNew} />
      <div className="relative z-10 -mt-16 space-y-2">
        {continueWatching.length > 0 && (
          <ContinueWatchingRow items={continueWatching} />
        )}
        <CarouselRow
          title="Trending Now"
          items={trending}
          isLoading={loadingTrending}
        />
        <CarouselRow
          title="New Releases"
          items={newReleases.slice(1)}
          isLoading={loadingNew}
        />
      </div>
    </div>
  );
}

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
}

function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
  }, [items]);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  return (
    <section className="mb-8">
      <h2 className="text-white text-lg font-semibold mb-3 px-6 md:px-12">Continue Watching</h2>
      <div className="group/carousel relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-opacity opacity-0 group-hover/carousel:opacity-100 hidden md:flex focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Scroll left"
          >
            &#8249;
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto px-6 md:px-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => {
            const contentItem: ContentListItem = {
              id: item.content_id,
              title: item.content.title,
              slug: item.content.slug,
              type: item.content.type,
              year: null,
              rating: null,
              poster_url: item.content.poster_url,
              backdrop_url: item.content.backdrop_url,
              genre_ids: [],
              is_published: true,
              view_count: 0,
              video: null,
              published_at: null,
              created_at: item.updated_at,
            };
            const progress = item.duration_seconds > 0
              ? (item.progress_seconds / item.duration_seconds) * 100
              : 0;
            return (
              <div
                key={item.id}
                className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ContentCard item={contentItem} progress={progress} />
              </div>
            );
          })}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-opacity opacity-0 group-hover/carousel:opacity-100 hidden md:flex focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Scroll right"
          >
            &#8250;
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add watch routes to the router**

Replace the full file content of `frontend/src/router/index.tsx`:

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import ContentListPage from '@/pages/admin/ContentListPage'
import ContentEditPage from '@/pages/admin/ContentEditPage'
import HomePage from '@/pages/HomePage'
import ContentDetailPage from '@/pages/ContentDetailPage'
import WatchPage from '@/pages/WatchPage'

// Placeholder pages — replaced in later phases
const BrowsePage = () => <div className="p-8 text-white">Browse — Phase 6</div>
const SubscriptionPage = () => <div className="p-8 text-white">Subscription — Phase 7</div>
const AdminDashboard = () => <div className="p-8 text-white">Admin — Phase 2</div>

export const router = createBrowserRouter([
  // Guest-only routes
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // Subscriber routes (with MainLayout nav bar)
  {
    element: <ProtectedRoute role="subscriber" />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/browse', element: <BrowsePage /> },
          { path: '/content/:slug', element: <ContentDetailPage /> },
        ],
      },
      // Watch routes — outside MainLayout (no nav bar), but still subscriber-protected
      { path: '/watch/:slug', element: <WatchPage /> },
      { path: '/watch/:slug/episode/:episodeId', element: <WatchPage /> },
    ],
  },

  // Auth-only (subscription page — no active sub needed)
  {
    path: '/subscription',
    element: <SubscriptionPage />,
  },

  // Admin routes
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/content', element: <ContentListPage /> },
          { path: '/admin/content/:id', element: <ContentEditPage /> },
        ],
      },
    ],
  },
])
```

- [ ] **Step 4: Run TypeScript check**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
cd /var/www/html/MidFlix
git add frontend/src/components/shared/ContentCard.tsx frontend/src/pages/HomePage.tsx frontend/src/router/index.tsx
git commit -m "feat: add Continue Watching carousel, progress bar on ContentCard, and watch routes"
```

---

## Dependency Graph

```
Task 1 (Model+Request+Resource) ── Task 2 (Service+Controller+Routes) ── Task 3 (Tests)
                                                                                │
Task 4 (hls.js+Types+API) ──── Task 5 (VideoPlayer) ─── Task 6 (WatchPage) ────┘
                                                              │
                                        Task 7 (Play Buttons) ┘
                                              │
                                        Task 8 (Progress+CW+Router) ── depends on Tasks 4, 6, 7
```

Tasks 1 and 4 can be built in parallel (backend and frontend foundations). Task 2 depends on Task 1. Task 3 depends on Task 2. Task 5 depends on Task 4. Task 6 depends on Tasks 2 and 5. Task 7 depends on Task 6. Task 8 depends on Tasks 4, 6, and 7.
