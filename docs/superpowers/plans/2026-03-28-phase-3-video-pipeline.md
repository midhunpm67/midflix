# Phase 3 — Video Pipeline (Mux) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable admin to attach Mux-hosted videos to content and episodes by pasting a Mux Playback ID, with thumbnail preview and video status indicators.

**Architecture:** Store only the Mux Playback ID in the `video` field. Derive HLS stream URL and thumbnail URL from the ID. No Mux API integration — admin uploads on mux.com and pastes the Playback ID into MidFlix admin forms.

**Tech Stack:** Laravel 12, MongoDB 7, Pest, React 19, TanStack Query v5, React Hook Form, Zod, Tailwind CSS

---

## File Map

### Backend — `backend/`
```
backend/
├── app/
│   ├── Models/
│   │   ├── Content.php                         (modify — no code change needed, video field already in $fillable without cast)
│   │   └── Episode.php                         (modify — remove video array cast, update default)
│   ├── Http/
│   │   └── Requests/Content/
│   │       ├── StoreContentRequest.php         (modify — add video.playback_id rule)
│   │       ├── UpdateContentRequest.php        (modify — add video.playback_id rule)
│   │       ├── StoreEpisodeRequest.php         (modify — add video.playback_id rule)
│   │       └── UpdateEpisodeRequest.php        (modify — add video.playback_id rule)
│   └── Services/
│       ├── ContentService.php                  (modify — build video object in store/update)
│       └── EpisodeService.php                  (modify — build video object in store/update)
├── database/factories/
│   └── ContentFactory.php                      (modify — update video field shape)
└── tests/Feature/Admin/
    └── ContentCrudTest.php                     (modify — add video playback_id tests)
```

### Frontend — `frontend/`
```
frontend/
├── src/
│   ├── types/
│   │   └── content.ts                          (modify — update VideoAsset, add video to payloads)
│   ├── lib/
│   │   └── mux.ts                              (create — URL derivation helpers)
│   ├── components/admin/
│   │   ├── ContentForm.tsx                     (modify — add playback_id field + thumbnail preview)
│   │   └── EpisodeList.tsx                     (modify — add playback_id to inline form + thumbnail in list)
│   └── pages/admin/
│       └── ContentListPage.tsx                 (modify — add Video status column)
```

---

## Task 1: Update Backend Models + Factory

**Files:**
- Modify: `backend/app/Models/Episode.php:23-31`
- Modify: `backend/database/factories/ContentFactory.php:30`

- [ ] **Step 1: Update Episode model — remove video array cast and update default**

In `backend/app/Models/Episode.php`, replace the `$casts` and `$attributes` arrays:

```php
protected $casts = [
    'number' => 'integer',
    'duration' => 'integer',
];

protected $attributes = [
    'video' => '{"playback_id":null,"status":"pending"}',
];
```

The `'video' => 'array'` cast is removed because MongoDB stores native BSON arrays; Eloquent's `array` cast double-decodes them on read. The default stays as a JSON string because `$attributes` is set before the first save — MongoDB will store it as a native BSON object after that.

- [ ] **Step 2: Update ContentFactory — change video field shape**

In `backend/database/factories/ContentFactory.php`, change line 30:

```php
'video' => ['playback_id' => null, 'status' => 'pending'],
```

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `cd /var/www/html/MidFlix/backend && php artisan test`

Expected: All 54 tests pass. The video field shape change does not break any existing test because no test currently asserts on the `hls_url` key.

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Models/Episode.php database/factories/ContentFactory.php
git commit -m "refactor: update video field to use Mux playback_id structure"
```

---

## Task 2: Add Video Validation to Form Requests

**Files:**
- Modify: `backend/app/Http/Requests/Content/StoreContentRequest.php:18-32`
- Modify: `backend/app/Http/Requests/Content/UpdateContentRequest.php:18-32`
- Modify: `backend/app/Http/Requests/Content/StoreEpisodeRequest.php:18-24`
- Modify: `backend/app/Http/Requests/Content/UpdateEpisodeRequest.php:18-24`

- [ ] **Step 1: Add video.playback_id rule to StoreContentRequest**

In `backend/app/Http/Requests/Content/StoreContentRequest.php`, add this line inside the `rules()` return array after the `'trailer_url'` rule:

```php
'video'              => ['sometimes', 'array'],
'video.playback_id'  => ['sometimes', 'nullable', 'string', 'max:100'],
```

The full rules array becomes:
```php
return [
    'title'              => ['required', 'string', 'max:255'],
    'description'        => ['required', 'string'],
    'type'               => ['required', 'in:movie,series'],
    'genre_ids'          => ['sometimes', 'array'],
    'genre_ids.*'        => ['string'],
    'cast'               => ['sometimes', 'array'],
    'cast.*'             => ['string'],
    'director'           => ['sometimes', 'nullable', 'string', 'max:255'],
    'year'               => ['sometimes', 'nullable', 'integer', 'min:1888', 'max:2100'],
    'rating'             => ['sometimes', 'nullable', 'in:G,PG,PG-13,R,NC-17,TV-MA,TV-14,TV-PG,TV-G,TV-Y'],
    'poster_url'         => ['sometimes', 'nullable', 'url'],
    'backdrop_url'       => ['sometimes', 'nullable', 'url'],
    'trailer_url'        => ['sometimes', 'nullable', 'url'],
    'video'              => ['sometimes', 'array'],
    'video.playback_id'  => ['sometimes', 'nullable', 'string', 'max:100'],
];
```

- [ ] **Step 2: Add video.playback_id rule to UpdateContentRequest**

In `backend/app/Http/Requests/Content/UpdateContentRequest.php`, add the same two rules after `'trailer_url'`:

```php
'video'              => ['sometimes', 'array'],
'video.playback_id'  => ['sometimes', 'nullable', 'string', 'max:100'],
```

- [ ] **Step 3: Add video.playback_id rule to StoreEpisodeRequest**

In `backend/app/Http/Requests/Content/StoreEpisodeRequest.php`, add after `'thumbnail_url'`:

```php
'video'              => ['sometimes', 'array'],
'video.playback_id'  => ['sometimes', 'nullable', 'string', 'max:100'],
```

- [ ] **Step 4: Add video.playback_id rule to UpdateEpisodeRequest**

In `backend/app/Http/Requests/Content/UpdateEpisodeRequest.php`, add after `'thumbnail_url'`:

```php
'video'              => ['sometimes', 'array'],
'video.playback_id'  => ['sometimes', 'nullable', 'string', 'max:100'],
```

- [ ] **Step 5: Run tests to verify no regressions**

Run: `cd /var/www/html/MidFlix/backend && php artisan test`

Expected: All 54 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Http/Requests/Content/StoreContentRequest.php app/Http/Requests/Content/UpdateContentRequest.php app/Http/Requests/Content/StoreEpisodeRequest.php app/Http/Requests/Content/UpdateEpisodeRequest.php
git commit -m "feat: add video.playback_id validation to content and episode form requests"
```

---

## Task 3: Update Services to Build Video Object

**Files:**
- Modify: `backend/app/Services/ContentService.php:64-69,71-81`
- Modify: `backend/app/Services/EpisodeService.php:10-15,17-22`

- [ ] **Step 1: Add buildVideoField helper to ContentService**

In `backend/app/Services/ContentService.php`, add this private method at the end of the class (before the closing `}`):

```php
private function buildVideoField(array $data): array
{
    if (isset($data['video']['playback_id'])) {
        $playbackId = $data['video']['playback_id'];
        $data['video'] = [
            'playback_id' => $playbackId ?: null,
            'status' => $playbackId ? 'ready' : 'pending',
        ];
    }
    return $data;
}
```

- [ ] **Step 2: Call buildVideoField in ContentService::store**

In `backend/app/Services/ContentService.php`, update the `store` method:

```php
public function store(array $data): Content
{
    $data['slug'] = $this->generateUniqueSlug($data['title']);
    $data = $this->buildVideoField($data);

    return Content::create($data);
}
```

- [ ] **Step 3: Call buildVideoField in ContentService::update**

In `backend/app/Services/ContentService.php`, update the `update` method:

```php
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
```

- [ ] **Step 4: Add buildVideoField helper to EpisodeService**

In `backend/app/Services/EpisodeService.php`, add this private method at the end of the class:

```php
private function buildVideoField(array $data): array
{
    if (isset($data['video']['playback_id'])) {
        $playbackId = $data['video']['playback_id'];
        $data['video'] = [
            'playback_id' => $playbackId ?: null,
            'status' => $playbackId ? 'ready' : 'pending',
        ];
    }
    return $data;
}
```

- [ ] **Step 5: Call buildVideoField in EpisodeService::store**

In `backend/app/Services/EpisodeService.php`, update the `store` method:

```php
public function store(Season $season, array $data): Episode
{
    $data['season_id'] = (string) $season->_id;
    $data['content_id'] = $season->content_id;
    $data = $this->buildVideoField($data);
    return Episode::create($data);
}
```

- [ ] **Step 6: Call buildVideoField in EpisodeService::update**

In `backend/app/Services/EpisodeService.php`, update the `update` method:

```php
public function update(Episode $episode, array $data): Episode
{
    $data = $this->buildVideoField($data);
    $episode->update($data);
    $episode->refresh();
    return $episode;
}
```

- [ ] **Step 7: Run tests to verify no regressions**

Run: `cd /var/www/html/MidFlix/backend && php artisan test`

Expected: All 54 tests pass.

- [ ] **Step 8: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add app/Services/ContentService.php app/Services/EpisodeService.php
git commit -m "feat: build video object from playback_id in content and episode services"
```

---

## Task 4: Add Backend Tests for Video Playback ID

**Files:**
- Modify: `backend/tests/Feature/Admin/ContentCrudTest.php`

- [ ] **Step 1: Write test — creating content with playback_id sets status to ready**

Add this test at the end of `backend/tests/Feature/Admin/ContentCrudTest.php`:

```php
test('admin can create content with video playback_id', function () {
    [, $token] = makeAdmin();

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', [
        'title'       => 'Video Test Movie',
        'description' => 'A movie with a video.',
        'type'        => 'movie',
        'video'       => ['playback_id' => 'abc123testplaybackid'],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.video.playback_id', 'abc123testplaybackid')
        ->assertJsonPath('data.video.status', 'ready');
});
```

- [ ] **Step 2: Run the new test to verify it passes**

Run: `cd /var/www/html/MidFlix/backend && php artisan test --filter="admin can create content with video playback_id"`

Expected: PASS

- [ ] **Step 3: Write test — updating content with null playback_id sets status to pending**

Add this test:

```php
test('updating content with null playback_id sets status to pending', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create();

    $response = $this->withToken($token)->putJson("/api/v1/admin/content/{$content->_id}", [
        'video' => ['playback_id' => null],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.video.playback_id', null)
        ->assertJsonPath('data.video.status', 'pending');
});
```

- [ ] **Step 4: Run the new test**

Run: `cd /var/www/html/MidFlix/backend && php artisan test --filter="updating content with null playback_id"`

Expected: PASS

- [ ] **Step 5: Write test — updating content with a playback_id sets status to ready**

Add this test:

```php
test('updating content with playback_id sets status to ready', function () {
    [, $token] = makeAdmin();
    $content = Content::factory()->create();

    $response = $this->withToken($token)->putJson("/api/v1/admin/content/{$content->_id}", [
        'video' => ['playback_id' => 'newplaybackid456'],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.video.playback_id', 'newplaybackid456')
        ->assertJsonPath('data.video.status', 'ready');
});
```

- [ ] **Step 6: Run the new test**

Run: `cd /var/www/html/MidFlix/backend && php artisan test --filter="updating content with playback_id sets status to ready"`

Expected: PASS

- [ ] **Step 7: Write test — video.playback_id rejects non-string values**

Add this test:

```php
test('video playback_id rejects non-string values', function () {
    [, $token] = makeAdmin();

    $response = $this->withToken($token)->postJson('/api/v1/admin/content', [
        'title'       => 'Bad Video',
        'description' => 'Should fail validation.',
        'type'        => 'movie',
        'video'       => ['playback_id' => 12345],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['video.playback_id']);
});
```

- [ ] **Step 8: Run the new test**

Run: `cd /var/www/html/MidFlix/backend && php artisan test --filter="video playback_id rejects non-string"`

Expected: PASS

- [ ] **Step 9: Run full test suite**

Run: `cd /var/www/html/MidFlix/backend && php artisan test`

Expected: All tests pass (54 existing + 4 new = 58 total).

- [ ] **Step 10: Commit**

```bash
cd /var/www/html/MidFlix/backend
git add tests/Feature/Admin/ContentCrudTest.php
git commit -m "test: add video playback_id tests for content CRUD"
```

---

## Task 5: Update Frontend Types + Create Mux URL Utility

**Files:**
- Modify: `frontend/src/types/content.ts:3-6,71-83,95-101`
- Create: `frontend/src/lib/mux.ts`

- [ ] **Step 1: Update VideoAsset type**

In `frontend/src/types/content.ts`, replace lines 3-6:

```ts
export interface VideoAsset {
  playback_id: string | null;
  status: 'pending' | 'ready';
}
```

- [ ] **Step 2: Add video to CreateContentPayload**

In `frontend/src/types/content.ts`, add `video` to `CreateContentPayload` (after `trailer_url`):

```ts
export interface CreateContentPayload {
  title: string;
  description: string;
  type: ContentType;
  genre_ids?: string[];
  cast?: string[];
  director?: string | null;
  year?: number | null;
  rating?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
  video?: { playback_id: string | null };
}
```

- [ ] **Step 3: Add video to CreateEpisodePayload**

In `frontend/src/types/content.ts`, update `CreateEpisodePayload`:

```ts
export interface CreateEpisodePayload {
  number: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
  video?: { playback_id: string | null };
}
```

- [ ] **Step 4: Create Mux URL utility**

Create `frontend/src/lib/mux.ts`:

```ts
const MUX_STREAM_BASE = 'https://stream.mux.com';
const MUX_IMAGE_BASE = 'https://image.mux.com';

export function getMuxStreamUrl(playbackId: string): string {
  return `${MUX_STREAM_BASE}/${playbackId}.m3u8`;
}

export function getMuxThumbnailUrl(playbackId: string): string {
  return `${MUX_IMAGE_BASE}/${playbackId}/thumbnail.jpg`;
}
```

- [ ] **Step 5: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/types/content.ts src/lib/mux.ts
git commit -m "feat: update VideoAsset type to use playback_id, add Mux URL utility"
```

---

## Task 6: Add Playback ID Field + Thumbnail Preview to ContentForm

**Files:**
- Modify: `frontend/src/components/admin/ContentForm.tsx`

- [ ] **Step 1: Add playback_id to the Zod schema**

In `frontend/src/components/admin/ContentForm.tsx`, add this field to the `contentSchema` object after `trailer_url`:

```ts
playback_id: z.string().nullable().optional(),
```

The full schema becomes:
```ts
const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['movie', 'series']),
  director: z.string().nullable().optional(),
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1888).max(2100).nullable().optional()
  ),
  rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14', 'TV-PG', 'TV-G', 'TV-Y', '']).transform((v) => v === '' ? null : v).nullable().optional(),
  poster_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  backdrop_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  trailer_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  playback_id: z.string().nullable().optional(),
});
```

- [ ] **Step 2: Add playback_id to form defaultValues**

In the `useForm` call, add `playback_id` to `defaultValues`:

```ts
defaultValues: {
  title: defaultValues?.title ?? '',
  description: defaultValues?.description ?? '',
  type: defaultValues?.type ?? 'movie',
  director: defaultValues?.director ?? '',
  year: defaultValues?.year ?? undefined,
  rating: (defaultValues?.rating ?? '') as FormValues['rating'],
  poster_url: defaultValues?.poster_url ?? '',
  backdrop_url: defaultValues?.backdrop_url ?? '',
  trailer_url: defaultValues?.trailer_url ?? '',
  playback_id: defaultValues?.video?.playback_id ?? '',
},
```

- [ ] **Step 3: Add video to handleFormSubmit**

In `handleFormSubmit`, add the `video` field to the payload:

```ts
function handleFormSubmit(values: FormValues) {
  onSubmit({
    ...values,
    year: values.year ?? null,
    poster_url: values.poster_url || null,
    backdrop_url: values.backdrop_url || null,
    trailer_url: values.trailer_url || null,
    director: values.director || null,
    rating: values.rating || null,
    video: { playback_id: values.playback_id || null },
  });
}
```

- [ ] **Step 4: Add import for getMuxThumbnailUrl and useState**

Add at the top of the file:

```ts
import { useState } from 'react';
import { getMuxThumbnailUrl } from '@/lib/mux';
```

- [ ] **Step 5: Add thumbnailError state**

Inside the `ContentForm` component, add state for thumbnail error:

```ts
const [thumbnailError, setThumbnailError] = useState(false);
```

- [ ] **Step 6: Add the Playback ID field + thumbnail preview to the form JSX**

Add this block after the Trailer URL field (after the `</div>` at line 175) and before the submit `<button>`:

```tsx
<div>
  <label htmlFor="playback_id" className="block text-sm text-muted-foreground mb-1">Mux Playback ID</label>
  <input
    id="playback_id"
    {...register('playback_id', {
      onChange: () => setThumbnailError(false),
    })}
    className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    placeholder="e.g. a1b2c3d4e5f6g7h8"
  />
  {watchedPlaybackId && !thumbnailError && (
    <img
      src={getMuxThumbnailUrl(watchedPlaybackId)}
      alt="Video thumbnail"
      className="mt-2 rounded border border-border max-w-xs"
      onError={() => setThumbnailError(true)}
    />
  )}
  {watchedPlaybackId && thumbnailError && (
    <div className="mt-2 rounded border border-border bg-card px-3 py-2 text-xs text-muted-foreground max-w-xs">
      Invalid Playback ID — thumbnail could not be loaded
    </div>
  )}
</div>
```

- [ ] **Step 7: Add watch for playback_id**

To make the thumbnail preview reactive, add `watch` to the `useForm` destructuring:

```ts
const {
  register,
  handleSubmit,
  watch,
  formState: { errors },
} = useForm<FormValues>({
```

And add this line after the `useForm` call:

```ts
const watchedPlaybackId = watch('playback_id');
```

- [ ] **Step 8: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 9: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/components/admin/ContentForm.tsx
git commit -m "feat: add Mux Playback ID field with thumbnail preview to ContentForm"
```

---

## Task 7: Add Playback ID to Episode Inline Form + Thumbnail in List

**Files:**
- Modify: `frontend/src/components/admin/EpisodeList.tsx`

- [ ] **Step 1: Add playback_id to the episode Zod schema**

In `frontend/src/components/admin/EpisodeList.tsx`, add to `episodeSchema`:

```ts
const episodeSchema = z.object({
  number: z.coerce.number().int().min(1, 'Required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1).nullable().optional()
  ),
  playback_id: z.string().nullable().optional(),
});
```

- [ ] **Step 2: Add getMuxThumbnailUrl import**

Add at the top of the file:

```ts
import { getMuxThumbnailUrl } from '@/lib/mux';
```

- [ ] **Step 3: Update mutation payloads to include video**

In the `createMutation` mutationFn, update the payload:

```ts
const createMutation = useMutation({
  mutationFn: (data: EpisodeFormValues) =>
    adminCreateEpisode(seasonId, {
      number: data.number,
      title: data.title,
      description: data.description ?? null,
      duration: data.duration ?? null,
      video: { playback_id: data.playback_id || null },
    }),
  onSuccess: () => {
    invalidate();
    setShowAdd(false);
  },
});
```

In the `updateMutation` mutationFn, update the payload:

```ts
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: EpisodeFormValues }) =>
    adminUpdateEpisode(id, {
      number: data.number,
      title: data.title,
      description: data.description ?? null,
      duration: data.duration ?? null,
      video: { playback_id: data.playback_id || null },
    }),
  onSuccess: () => {
    invalidate();
    setEditingId(null);
  },
});
```

- [ ] **Step 4: Pass playback_id as defaultValue when editing**

In the edit form rendering (inside `episodes.map`), update the `defaultValues` prop:

```tsx
<InlineEpisodeForm
  defaultValues={{
    number: ep.number,
    title: ep.title,
    description: ep.description,
    duration: ep.duration,
    playback_id: ep.video?.playback_id,
  }}
  onSubmit={(data) => updateMutation.mutate({ id: ep.id, data })}
  onCancel={() => setEditingId(null)}
  isSubmitting={updateMutation.isPending}
  error={updateMutation.isError ? ((updateMutation.error as Error)?.message ?? 'Something went wrong') : undefined}
/>
```

- [ ] **Step 5: Add thumbnail to episode list display**

In the episode list view (the non-editing state), add a small thumbnail next to episodes that have a playback_id. Update the display row:

```tsx
<div className="flex items-center gap-3 text-sm py-1">
  <span className="text-muted-foreground w-6 text-right">{ep.number}.</span>
  {ep.video?.playback_id && (
    <img
      src={getMuxThumbnailUrl(ep.video.playback_id)}
      alt=""
      className="w-12 h-7 rounded object-cover border border-border"
    />
  )}
  <span className="text-white flex-1">{ep.title}</span>
  {ep.duration != null && (
    <span className="text-muted-foreground text-xs">{ep.duration}m</span>
  )}
  <button
    onClick={() => setEditingId(ep.id)}
    className="text-xs text-primary hover:underline"
  >
    Edit
  </button>
  <button
    onClick={() => {
      if (!confirm(`Delete "${ep.title}"?`)) return;
      deleteMutation.mutate(ep.id);
    }}
    className="text-xs text-destructive hover:underline"
  >
    Delete
  </button>
</div>
```

- [ ] **Step 6: Add playback_id input to InlineEpisodeForm**

In the `InlineEpisodeForm` component, add `playback_id` to the `defaultValues` in `useForm`:

```ts
defaultValues: {
  number: defaultValues.number ?? 1,
  title: defaultValues.title ?? '',
  description: defaultValues.description ?? '',
  duration: defaultValues.duration ?? undefined,
  playback_id: defaultValues.playback_id ?? '',
},
```

Add the input field in the form JSX, after the duration input and before the Save button:

```tsx
<input
  {...register('playback_id')}
  placeholder="Mux ID"
  className="w-24 bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
/>
```

- [ ] **Step 7: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 8: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/components/admin/EpisodeList.tsx
git commit -m "feat: add Mux Playback ID to episode inline form with thumbnail preview"
```

---

## Task 8: Add Video Status Column to ContentListPage

**Files:**
- Modify: `frontend/src/pages/admin/ContentListPage.tsx`

- [ ] **Step 1: Add video to ContentListItem type and ContentListResource**

In `frontend/src/types/content.ts`, add `video` to `ContentListItem` (after `view_count`):

```ts
export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  year: number | null;
  rating: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genre_ids: string[];
  is_published: boolean;
  view_count: number;
  video: VideoAsset | null;
  published_at: string | null;
  created_at: string;
}
```

In `backend/app/Http/Resources/ContentListResource.php`, add `'video' => $this->video,` after the `'view_count'` line:

```php
return [
    'id'           => (string) $this->_id,
    'title'        => $this->title,
    'slug'         => $this->slug,
    'type'         => $this->type,
    'year'         => $this->year,
    'rating'       => $this->rating,
    'poster_url'   => $this->poster_url,
    'backdrop_url' => $this->backdrop_url,
    'genre_ids'    => $this->genre_ids ?? [],
    'is_published' => $this->is_published,
    'view_count'   => $this->view_count,
    'video'        => $this->video,
    'published_at' => $this->published_at?->toIso8601String(),
    'created_at'   => $this->created_at?->toIso8601String(),
];
```

- [ ] **Step 2: Add Video column header**

In the `<thead>`, add a "Video" column after the "Status" column:

```tsx
<tr>
  <th className="px-4 py-3">Title</th>
  <th className="px-4 py-3">Type</th>
  <th className="px-4 py-3">Year</th>
  <th className="px-4 py-3">Status</th>
  <th className="px-4 py-3">Video</th>
  <th className="px-4 py-3">Views</th>
  <th className="px-4 py-3">Actions</th>
</tr>
```

- [ ] **Step 3: Update colSpan for empty state**

Update the empty state row colSpan from 6 to 7:

```tsx
<td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
```

- [ ] **Step 4: Add Video status cell to each row**

After the Status `<td>` and before the Views `<td>`, add:

```tsx
<td className="px-4 py-3">
  <span className={`inline-flex items-center gap-1.5 text-xs ${
    item.video?.status === 'ready'
      ? 'text-green-400'
      : 'text-muted-foreground'
  }`}>
    <span className={`w-2 h-2 rounded-full ${
      item.video?.status === 'ready'
        ? 'bg-green-400'
        : 'bg-muted-foreground'
    }`} />
    {item.video?.status === 'ready' ? 'Ready' : 'Pending'}
  </span>
</td>
```

- [ ] **Step 5: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/pages/admin/ContentListPage.tsx src/types/content.ts
cd /var/www/html/MidFlix/backend
git add app/Http/Resources/ContentListResource.php
git commit -m "feat: add Video status column to admin content list page"
```

---

## Dependency Graph

```
Task 1 (Models + Factory) ──┐
                             ├── Task 3 (Services) ── Task 4 (Backend Tests)
Task 2 (Form Requests) ─────┘

Task 5 (Frontend Types + Mux Utility) ── Task 6 (ContentForm)
                                       ├── Task 7 (EpisodeList)
                                       └── Task 8 (ContentListPage)
```

Tasks 1-2 can run in parallel. Tasks 5-8 depend on 1-4 being complete. Tasks 6-8 depend on 5.
