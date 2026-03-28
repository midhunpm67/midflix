# Phase 5 — Video Player Design Spec

**Goal:** Build an HLS.js video player with custom controls, watch page (with episode list for series), watch history tracking (save on pause/exit, resume on load), native Picture-in-Picture, and a "Continue Watching" row on the Home page.

**Scope:** Video player component, watch page (`/watch/:slug` and `/watch/:slug/episode/:episodeId`), watch history backend API, "Continue Watching" carousel, enable Play buttons on HeroBanner and ContentDetailPage.

---

## 1. Video Player Component

### VideoPlayer

A reusable HLS video player component wrapping a `<video>` element with HLS.js for adaptive bitrate streaming.

**Props:**
- `playbackId: string | null` — Mux Playback ID. If null, show "Video not available" placeholder.
- `posterUrl?: string | null` — poster image for the video element
- `onTimeUpdate?: (currentTime: number, duration: number) => void` — fires on timeupdate for progress tracking
- `onPause?: () => void` — fires when video pauses
- `onPlay?: () => void` — fires when video plays
- `onEnded?: () => void` — fires when video finishes
- `initialTime?: number` — seek to this position on load (for resume)
- `autoPlay?: boolean` — auto-play on mount (default false)

**HLS.js integration:**
- Import `Hls` from `hls.js`
- On mount: if `Hls.isSupported()`, create HLS instance, attach to video element, load `getMuxStreamUrl(playbackId)`
- If not supported but `video.canPlayType('application/vnd.apple.mpegurl')` (Safari), set `video.src` directly to the HLS URL
- On unmount: destroy HLS instance to prevent memory leaks
- Re-initialize when `playbackId` changes

**Placeholder state:**
- When `playbackId` is null: render a dark container with centered "Video not available" text
- Same dimensions as the player would occupy

### Custom Controls Overlay

Controls overlay on top of the video element. Auto-hides after 3 seconds of no mouse movement, reappears on hover or tap.

**Controls:**
- **Play/Pause** — toggle button (▶ / ⏸)
- **Seek bar** — range input or custom div showing played progress (cyan) and buffered range (grey). Click/drag to seek.
- **Time display** — `currentTime / duration` formatted as `mm:ss` or `hh:mm:ss`
- **Volume** — mute toggle button + slider (horizontal, small). Muted icon changes.
- **Fullscreen** — toggle button, uses `element.requestFullscreen()` / `document.exitFullscreen()`
- **PiP** — button that calls `video.requestPictureInPicture()`. Hidden if `!document.pictureInPictureEnabled`.

**Styling:**
- Semi-transparent black gradient at bottom for controls bar: `bg-gradient-to-t from-black/80 to-transparent`
- Controls positioned at the bottom of the player
- White icons/text, cyan for progress bar fill
- Responsive: on mobile, volume slider hidden (mobile volume is hardware-controlled)

**Auto-hide behavior:**
- Track mouse movement over the player container
- After 3 seconds of no movement, hide controls (CSS transition opacity → 0, cursor hidden)
- On mouse move or tap: show controls again, reset the 3s timer
- Always show controls when paused

---

## 2. Watch Page

### Routes

- `/watch/:slug` — movie watch page
- `/watch/:slug/episode/:episodeId` — series episode watch page

Both routes sit outside MainLayout — the watch page is full-width with no nav bar.

### Layout

**Top bar overlay:**
- Positioned absolutely over the top of the player area
- Back button (← arrow) linking to `/content/:slug`
- Title text next to the back button (content title, or "S1:E3 — Episode Title" format for series)
- Semi-transparent, auto-hides with the player controls

**Movie mode (`/watch/:slug`):**
- Fetches content by slug via `getContentBySlug(slug)`
- Renders `VideoPlayer` with `content.video.playback_id`
- Player takes full viewport width with `aspect-video` (16:9 ratio)

**Series mode (`/watch/:slug/episode/:episodeId`):**
- Fetches content by slug, seasons by slug, episodes for the relevant season
- Identifies the current episode from `episodeId` URL param
- Renders `VideoPlayer` with `episode.video.playback_id`
- Below the player: episode list section

**Episode list (series only):**
- Shows episodes for the current episode's season
- Each row: episode number, title, duration
- Currently playing episode highlighted (cyan left border or background tint)
- Clicking another episode navigates to `/watch/:slug/episode/:newEpisodeId`
- Auto-advance: when current episode ends (`onEnded`), navigate to the next episode in the season. If it's the last episode, do nothing.

### Data fetching

- `useQuery(['content', slug])` → `getContentBySlug(slug)` — content details
- `useQuery(['content-seasons', slug])` → `getContentSeasons(slug)` — seasons (series only)
- `useQuery(['season-episodes', seasonId])` → `getSeasonEpisodes(seasonId)` — episodes for the current season
- `useQuery(['watch-history', contentId, episodeId])` → `getWatchHistory(contentId, episodeId)` — resume position

### Watch history integration on the watch page

- **On load:** if watch history exists for this content/episode, pass `initialTime={history.progress_seconds}` to `VideoPlayer`
- **On pause:** call `saveWatchHistory({ content_id, episode_id, progress_seconds, duration_seconds })`
- **On `beforeunload`:** same save call (uses `navigator.sendBeacon` or synchronous fetch for reliability)
- **On ended:** save with `progress_seconds = duration_seconds` (backend marks as completed)

---

## 3. Watch History Backend

### Model: WatchHistory

**Collection:** `watch_history`

**Fields:**
- `user_id` — string, required
- `content_id` — string, required
- `episode_id` — string, nullable (null for movies)
- `progress_seconds` — integer, required
- `duration_seconds` — integer, required
- `completed` — boolean, default false
- `created_at`, `updated_at` — timestamps

**Unique constraint:** compound `[user_id, content_id, episode_id]` — one record per user per content/episode.

### API Endpoints

All require `auth:sanctum`. No role restriction — any authenticated user can track their own history.

**`POST /api/v1/me/watch-history`**
- Body: `{ content_id: string, episode_id?: string|null, progress_seconds: integer, duration_seconds: integer }`
- Upserts based on `[user_id, content_id, episode_id]`
- Sets `completed: true` if `progress_seconds >= duration_seconds * 0.9`
- Returns the watch history record

**`GET /api/v1/me/watch-history/:contentId`**
- Optional query param: `?episode_id=xxx`
- Returns the matching watch history record, or 404 if none
- Used to get resume position on page load

**`GET /api/v1/me/continue-watching`**
- Returns up to 10 most recently updated watch history records where `completed = false`
- Each record includes the associated content data (title, slug, type, poster_url, backdrop_url) via a join/lookup
- Ordered by `updated_at` desc
- Used for the "Continue Watching" row on Home page

### Service: WatchHistoryService

- `upsert(userId, data)` — find or create by `[user_id, content_id, episode_id]`, update progress fields, calculate completed flag
- `getProgress(userId, contentId, episodeId?)` — find single record
- `continueWatching(userId, limit = 10)` — query non-completed records with content lookup, ordered by recency

### Form Request: StoreWatchHistoryRequest

- `content_id` — required, string
- `episode_id` — sometimes, nullable, string
- `progress_seconds` — required, integer, min:0
- `duration_seconds` — required, integer, min:1

### Resource: WatchHistoryResource

Returns: `id`, `content_id`, `episode_id`, `progress_seconds`, `duration_seconds`, `completed`, `updated_at`

### ContinueWatchingResource

Returns: `id`, `content_id`, `episode_id`, `progress_seconds`, `duration_seconds`, `content` (nested: `title`, `slug`, `type`, `poster_url`, `backdrop_url`), `updated_at`

### Routes

Inside `routes/api.php`, add to the existing `auth:sanctum` group:

```
POST   /me/watch-history
GET    /me/watch-history/{contentId}
GET    /me/continue-watching
```

### Controller: WatchHistoryController

Three methods: `store`, `show`, `continueWatching`. Thin controller — delegates to `WatchHistoryService`.

---

## 4. Frontend API Client + Types

### Types (`frontend/src/types/content.ts`)

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

### API Client (`frontend/src/api/watch-history.ts`)

```ts
saveWatchHistory(data: { content_id, episode_id?, progress_seconds, duration_seconds }) → WatchHistoryItem
getWatchHistory(contentId, episodeId?) → WatchHistoryItem
getContinueWatching() → ContinueWatchingItem[]
```

---

## 5. Home Page Integration

### Continue Watching Row

- Fetched via `useQuery(['continue-watching'], getContinueWatching)`
- Rendered as a `CarouselRow` at the top of HomePage (before "Trending Now"), only when items exist
- Uses `ContentCard` with an added progress bar

### ContentCard Progress Bar

- `ContentCard` gains an optional `progress?: number` prop (0-100 percentage)
- When present, renders a thin (2-3px) cyan bar at the bottom of the card, filled to the percentage width
- The "Continue Watching" carousel maps `ContinueWatchingItem` to `ContentListItem`-compatible objects with the progress percentage calculated as `(progress_seconds / duration_seconds) * 100`

---

## 6. Enable Play Buttons

### HeroBanner

Change the disabled `<button>` back to a `<Link>`:
- Links to `/watch/${content.slug}` for movies
- For series displayed as hero (unlikely but possible), link to `/content/${content.slug}` (user picks episode from detail page)

### ContentDetailPage

Change the disabled Play `<button>` to a `<Link>`:
- Movies: `/watch/${content.slug}`
- Series: `/watch/${content.slug}/episode/${firstEpisodeId}` — where `firstEpisodeId` is the first episode of the first season. If no episodes exist, keep the button disabled.

---

## 7. What is NOT in Scope

- **Subtitles/captions** — future enhancement
- **Quality selector** — HLS.js handles adaptive bitrate automatically
- **Playback speed** — future enhancement
- **Download** — not applicable for streaming
- **Social sharing** — future enhancement
- **Keyboard shortcuts** (space for play/pause, arrow keys for seek) — future enhancement, though basic video element keyboard support works natively
- **Custom floating mini-player** — using native PiP instead
- **Offline support** — not applicable

---

## 8. Testing

### Backend
- Pest tests for watch history CRUD: upsert creates new record, upsert updates existing, completed flag at 90% threshold, continue-watching returns non-completed ordered by recency, auth required
- Verify 404 for non-existent watch history lookups

### Frontend
- TypeScript check passes with all new types and components
- HLS.js integration is not unit-testable (requires browser video element) — verified manually
