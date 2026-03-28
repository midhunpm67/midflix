# Phase 4 — Browse & Home Design Spec

**Goal:** Build the public-facing Home page and Content Detail page so subscribers can browse and view content. No new backend work — all APIs exist from Phase 2.

**Scope:** Home page (`/`) and Content Detail page (`/content/:slug`). Browse page (`/browse`) deferred to Phase 6 with search.

---

## 1. Pages

### Home Page (`/`)

The landing page for authenticated subscribers. Features a full-bleed hero banner showcasing the most recently published content, followed by two horizontally scrollable carousel rows.

**Hero banner:**
- Displays the first item from the new releases API (most recently published)
- Full-width, `80vh` height
- Backdrop image (`backdrop_url`) as `background-image` with `object-fit: cover`
- Left-to-right gradient overlay: `linear-gradient(to right, rgba(10,10,10,0.95) 35%, transparent 65%)`
- Bottom fade: `linear-gradient(to top, #0A0A0A 5%, transparent 40%)`
- Content (left-aligned): title in `font-display` (Bebas Neue), metadata line (year, rating, type), truncated description (2-3 lines max), Play button (primary cyan) + More Info button (semi-transparent white)
- Play button links to `/watch/:slug` (placeholder route for Phase 5)
- More Info button links to `/content/:slug`
- If no backdrop_url, render a solid `bg-background` with just text content
- If no published content exists, show a centered "No content available yet" message instead of the hero

**Carousel rows (2 rows):**
1. **Trending Now** — data from `getTrending()` API
2. **New Releases** — data from `getNewReleases()` API

Each row renders `ContentCard` components in a horizontally scrollable container.

**Loading state:** Skeleton placeholders — grey shimmer rectangles matching card dimensions for both hero and carousel rows.

### Content Detail Page (`/content/:slug`)

Displays full details for a single content item (movie or series). Accessed by clicking a card or the "More Info" button on the hero.

**Layout:**
- Full-width backdrop image, `h-[60vh]`, same gradient overlay pattern as the hero banner
- Info section overlaps the bottom of the backdrop
- Title in `font-display`, large
- Metadata line: year, rating, type (movie/series), genre names (resolved from `genre_ids` via the genres API)
- Full description text
- Play button (primary cyan) — links to `/watch/:slug` (Phase 5 placeholder)
- If no backdrop_url, render solid dark background

**Series-specific:**
- Below the info section, render an expandable season list
- Each season header is clickable — shows/hides its episodes
- First season expanded by default
- Episode rows: episode number, title, duration (read-only, styled for public view)
- Episodes fetched lazily per season on expand (same pattern as admin `EpisodesWrapper`)

**Data fetching:**
- `useQuery(['content', slug])` → `getContentBySlug(slug)` (increments view count server-side)
- `useQuery(['genres'])` → `getGenres()` (for resolving genre_ids to names)
- `useQuery(['content-seasons', slug])` → `getContentSeasons(slug)` — only when `type === 'series'`
- `useQuery(['season-episodes', seasonId])` → `getSeasonEpisodes(seasonId)` — on season expand

**Error states:**
- 404: "Content not found" message with a link back to Home
- Network error: generic error message with retry option

---

## 2. Shared Components

### ContentCard

Portrait poster card for use in carousel rows.

- **Aspect ratio:** `aspect-[2/3]` (portrait, 2:3)
- **Image:** `poster_url` with `object-cover`, fallback to grey placeholder div if no poster
- **Hover effect:** `scale(1.08)` over `200ms ease-out`, title overlay fades in at the bottom with a gradient `linear-gradient(transparent, rgba(0,0,0,0.85))`
- **Title overlay:** shows title text at bottom of card on hover
- **Link:** wraps entire card, links to `/content/:slug` (single route handles both movies and series)
- **Rounded corners:** `rounded-card` (8px from tailwind config)
- **Props:** `item: ContentListItem`

### CarouselRow

Horizontally scrollable row of content cards with a section title.

- **Title:** white, `text-lg font-semibold`, left-aligned above the row
- **Container:** `overflow-x: auto` with `scroll-snap-type: x mandatory`, hidden scrollbar via `[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`
- **Card snapping:** each card has `scroll-snap-align: start`
- **Arrow buttons:** semi-transparent circles (`bg-white/10 hover:bg-white/20`) at left/right edges, positioned absolutely over the row. Hidden on mobile (touch scroll), shown on desktop hover.
- **Spacing:** `gap-3` between cards
- **Card sizing:** responsive — approximately 6 visible on desktop, 3 on tablet, 2 on mobile. Use a fixed width class that scales with breakpoints.
- **Props:** `title: string`, `items: ContentListItem[]`, `isLoading?: boolean`
- **Loading state:** when `isLoading` is true, render 6 skeleton cards (grey rectangles with shimmer animation matching card aspect ratio)
- **Empty state:** if `items` is empty and not loading, render nothing (row hidden entirely)

### HeroBanner

Full-bleed hero section for the home page.

- **Props:** `content: ContentListItem | null`, `isLoading: boolean`
- **Loading state:** full-width skeleton with shimmer (80vh height)
- **Null content:** "No content available yet" centered message
- **Renders:** backdrop image with gradient overlays, title, metadata, description, Play + More Info buttons
- **Responsive:** title font-size scales down on mobile (`text-4xl md:text-6xl`), description hidden on very small screens

---

## 3. Router Updates

**Add to subscriber routes in `frontend/src/router/index.tsx`:**
- `{ path: 'content/:slug', element: <ContentDetailPage /> }` — inside the MainLayout group

**Update placeholder:**
- Replace the inline `HomePage` placeholder with the real `HomePage` component import

**No changes to `/watch/:slug`** — that route stays as a Phase 5 placeholder.

---

## 4. Responsive Behavior

| Element | Desktop (1280px+) | Tablet (768px) | Mobile (<640px) |
|---|---|---|---|
| Hero height | 80vh | 70vh | 60vh |
| Hero title | text-6xl | text-4xl | text-3xl |
| Hero description | 3 lines, max-w-lg | 2 lines, max-w-md | hidden |
| Cards per row (visible) | ~6 | ~3 | ~2 |
| Carousel arrows | visible on hover | hidden | hidden |
| Detail backdrop | h-[60vh] | h-[50vh] | h-[40vh] |
| Season list | full width, max-w-3xl | full width | full width |

---

## 5. What is NOT in Scope

- **Browse page** (`/browse`) — deferred to Phase 6 with search
- **Video player** — Phase 5 (Play button links to `/watch/:slug` placeholder)
- **Continue Watching row** — requires watch history tracking (Phase 5)
- **Similar content row** — future enhancement
- **Cast section** — future enhancement
- **Trailer embed** — future enhancement
- **Watchlist / Share buttons** — future enhancement
- **Genre-based carousel rows** — can be added later, not in initial scope
- **Top 10 with ranking numbers** — future enhancement
- **Admin "featured" curation** — hero uses most recently published, no new backend fields
