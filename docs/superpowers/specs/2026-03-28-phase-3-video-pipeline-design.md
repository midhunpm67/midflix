# Phase 3 — Video Pipeline (Mux) Design Spec

**Goal:** Enable admin to attach Mux-hosted videos to content (movies) and episodes by pasting a Mux Playback ID. The system derives HLS stream URLs and thumbnail URLs from the Playback ID. No Mux API integration — admin uploads directly on mux.com, then pastes the Playback ID into MidFlix admin.

**Architecture:** The admin uploads a video file to the Mux dashboard (mux.com). Mux transcodes it and provides a Playback ID. The admin pastes this ID into the MidFlix content/episode edit form. MidFlix stores only the Playback ID and derives all URLs deterministically:

- HLS stream: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
- Thumbnail: `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg`

No backend jobs, no webhooks, no S3, no FFmpeg, no CloudFront.

---

## 1. Data Model

### VideoAsset shape (replaces the old `hls_url` structure)

```json
{
  "playback_id": "String | null",
  "status": "pending | ready"
}
```

- `playback_id`: The Mux Playback ID string, or `null` if no video is attached.
- `status`: `"pending"` when `playback_id` is null; `"ready"` when a Playback ID is set. Status is derived from `playback_id` presence — not set independently.

### Default value (both Content and Episode models)

```json
{"playback_id": null, "status": "pending"}
```

### Frontend TypeScript type

```ts
export interface VideoAsset {
  playback_id: string | null;
  status: 'pending' | 'ready';
}
```

### URL derivation (frontend-only, no backend computation)

```ts
const MUX_STREAM_BASE = 'https://stream.mux.com';
const MUX_IMAGE_BASE = 'https://image.mux.com';

function getHlsUrl(playbackId: string): string {
  return `${MUX_STREAM_BASE}/${playbackId}.m3u8`;
}

function getThumbnailUrl(playbackId: string): string {
  return `${MUX_IMAGE_BASE}/${playbackId}/thumbnail.jpg`;
}
```

These helpers live in a shared utility, not duplicated across components.

---

## 2. Backend Changes

### 2.1 Models

**Content model** (`backend/app/Models/Content.php`):
- Update `video` in `$attributes` default to `{"playback_id":null,"status":"pending"}`
- The `video` field is not cast (BSON native array in MongoDB — no Eloquent `array` cast per Phase 2 learnings)

**Episode model** (`backend/app/Models/Episode.php`):
- Update `video` default attribute to `{"playback_id":null,"status":"pending"}`
- Remove the `'video' => 'array'` cast. MongoDB stores native BSON arrays; Eloquent's `array` cast double-decodes them on read (same issue Content had in Phase 2). The `video` field should be uncast, like Content's.

### 2.2 Form Requests

**StoreContentRequest / UpdateContentRequest:**
- Add optional validation rule: `'video.playback_id' => 'nullable|string|max:100'`
- No validation on `video.status` — the backend derives it

**StoreEpisodeRequest / UpdateEpisodeRequest:**
- Same: `'video.playback_id' => 'nullable|string|max:100'`

### 2.3 Services

**ContentService:**
- In `store()` and `update()`: if `video.playback_id` is present in the input, build the video object:
  - If `playback_id` is non-null and non-empty: `{ "playback_id" => $value, "status" => "ready" }`
  - If `playback_id` is null or empty: `{ "playback_id" => null, "status" => "pending" }`
- Set this as the `video` field on the model

**EpisodeService:**
- Same logic in `store()` and `update()`

### 2.4 Resources

**ContentResource + EpisodeResource:**
- Already return `'video' => $this->video` — no changes needed. The new structure (`playback_id` + `status`) flows through automatically.

### 2.5 Factory

**ContentFactory:**
- Update the `video` field definition to use the new shape: `{ "playback_id" => null, "status" => "pending" }`
- Optionally add a `withVideo()` state that sets a fake playback ID for testing

---

## 3. Frontend Changes

### 3.1 Types (`frontend/src/types/content.ts`)

Update `VideoAsset`:
```ts
export interface VideoAsset {
  playback_id: string | null;
  status: 'pending' | 'ready';
}
```

No changes to `Content` or `Episode` interfaces — they already reference `VideoAsset`.

### 3.2 Mux URL Utility (`frontend/src/lib/mux.ts`)

New file with two pure functions:

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

### 3.3 ContentForm (`frontend/src/components/admin/ContentForm.tsx`)

Add a "Mux Playback ID" field:
- Text input below the existing form fields
- Zod schema adds: `playback_id: z.string().nullable().optional()`
- On submit, construct the video object: `video: { playback_id: value || null, status: value ? 'ready' : 'pending' }`

Add thumbnail preview:
- When `playback_id` has a value, render an `<img>` below the input showing the Mux thumbnail
- Use `onError` handler on the `<img>` to show an error state if the thumbnail fails to load (e.g. grey box with "Invalid Playback ID" text)
- When `playback_id` is empty, show nothing

### 3.4 EpisodeList (`frontend/src/components/admin/EpisodeList.tsx`)

**Inline episode form:**
- Add a "Mux Playback ID" text input to `InlineEpisodeForm` (same row pattern as number/title/duration)
- On submit, include `video: { playback_id: value || null, status: value ? 'ready' : 'pending' }`

**Episode list view:**
- For episodes that have a `playback_id`, show a small thumbnail (e.g. 48x27px) next to the episode title using `getMuxThumbnailUrl()`
- For episodes without a video, show nothing (keep current layout)

### 3.5 ContentListPage (`frontend/src/pages/admin/ContentListPage.tsx`)

Add a "Video" column to the admin content table:
- Show a green dot (or small green circle) with text "Ready" when `content.video?.status === 'ready'`
- Show a grey dot with text "Pending" when status is `pending` or video is null
- Column should be narrow — just a status indicator

### 3.6 API Clients

**`frontend/src/api/admin/content.ts`:**
- `CreateContentPayload` and `UpdateContentPayload` types in `frontend/src/types/content.ts` need to include the optional `video` field: `video?: { playback_id: string | null }`

No changes to the API client functions themselves — they already send the full payload.

---

## 4. What is NOT in scope

- **Mux API integration** — No server-side Mux SDK, no API keys, no programmatic uploads
- **Video player** — Phase 5 handles HLS.js player, controls, mini-player
- **Webhooks** — Not needed; admin handles uploads on mux.com directly
- **Transcoding jobs** — Mux handles this; no `video_jobs` collection needed
- **S3 / CloudFront / FFmpeg** — Entirely replaced by Mux
- **Poster/backdrop auto-generation from video** — Admin still sets poster/backdrop URLs manually as in Phase 2

---

## 5. Testing

### Backend
- Update existing Content CRUD tests: verify that sending `video.playback_id` results in `status: 'ready'` in the response
- Update existing Episode CRUD tests: same verification
- Test that sending `video.playback_id: null` results in `status: 'pending'`
- Test that `video.playback_id` validation rejects non-string values

### Frontend
- TypeScript check passes with updated `VideoAsset` type
- Mux URL utility functions are pure — unit testable if desired, but not required for this phase

---

## 6. Migration Notes

This is a testing project with no production data. No data migration script is needed. Existing documents with the old `{ hls_url, status }` shape will be overwritten on next save, or can be cleared by re-seeding.
