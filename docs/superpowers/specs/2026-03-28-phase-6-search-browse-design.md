# Phase 6 — Search & Browse Design Spec

**Goal:** Build the Browse page (`/browse`) with search, genre/type filters, a responsive content grid, and infinite scroll pagination. No backend changes — all APIs exist from Phase 2.

**Scope:** Browse page implementation + ContentGrid shared component + MainLayout nav link update.

---

## 1. Browse Page (`/browse`)

The Browse page is the content discovery hub. It combines a search bar, filter controls, and a responsive grid of content cards with infinite scroll.

### Search Bar

- Full-width text input at the top of the page with a search icon (magnifying glass)
- Placeholder text: "Search movies and series..."
- **Debounced** at 300ms — does not fire a request on every keystroke
- When the search input has text, the page switches to **search mode**: calls `searchContent(q, page)` instead of `browseContent(params)`
- When search is cleared, reverts to browse mode with current filters
- Filters (type, genre) apply in both modes: in browse mode they're passed as API params; in search mode they're passed as additional filters if the backend supports them, otherwise applied client-side

**Note on search + filters:** The existing `searchContent(q, page)` API does not accept `type` or `genre_id` filters. In search mode, results are returned unfiltered by the backend. If filters are active during search, apply them client-side by filtering the returned items before rendering. This is acceptable for a testing project with a small dataset.

### Filter Bar

Horizontal row below the search bar with two controls:

**Type toggle:**
- Three options: All / Movies / Series
- Pill-style buttons (one active at a time)
- Active state: `bg-primary text-white`
- Inactive state: `bg-surface text-muted hover:text-white`
- "All" selected by default (no type filter)
- Maps to `type` param: `undefined` for All, `'movie'` for Movies, `'series'` for Series

**Genre dropdown:**
- `<select>` element styled to match the dark theme
- First option: "All Genres" (no filter)
- Populated from `getGenres()` API
- Maps to `genre_id` param: `undefined` for "All Genres", genre's `id` for a specific genre

**Filter behavior:**
- Changing any filter resets pagination to page 1
- Changing any filter clears accumulated infinite scroll results and fetches fresh

### Content Grid

- Responsive CSS grid of `ContentCard` components
- Grid columns: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`
- Gap: `gap-3`
- Horizontal padding: `px-6 md:px-12` (matches carousel padding)

### Infinite Scroll

- Uses TanStack Query's `useInfiniteQuery` for page accumulation
- A sentinel `<div>` at the bottom of the grid, observed by `IntersectionObserver`
- When the sentinel becomes visible and there are more pages (`current_page < last_page`), fetch the next page
- New page results are appended to the existing grid (not replaced)
- Shows a small spinner below the grid while loading the next page
- When `current_page >= last_page`, stop observing and show "You've seen it all" text

### States

- **Initial loading:** 12 skeleton cards in the grid (grey shimmer rectangles matching card aspect ratio)
- **Empty results:** centered message "No results found." with muted text
- **Search mode empty:** "No results for '{query}'" message
- **Error:** generic "Something went wrong" with retry button
- **End of results:** subtle "You've seen it all" text below the grid

---

## 2. Components

### ContentGrid (new shared component)

Renders a responsive grid of content cards.

**Props:**
- `items: ContentListItem[]` — content to display
- `isLoading: boolean` — when true, shows 12 skeleton placeholders

**Behavior:**
- Grid layout: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3`
- Each cell renders a `ContentCard` component
- When `isLoading` and `items` is empty, renders 12 skeleton cards
- When `isLoading` and `items` has content (loading more), skeleton is not shown (spinner is separate)
- When not loading and empty, renders nothing (parent handles empty state message)

### BrowsePage (page component)

- Manages all state: search query, debounced query, type filter, genre filter
- Uses `useInfiniteQuery` for paginated data
- Composes SearchBar + FilterBar + ContentGrid + InfiniteScroll sentinel
- Search bar, filter bar, and infinite scroll sentinel are implemented inline (not extracted into separate components)

### MainLayout update

- Add "Browse" nav link next to "Home" link, pointing to `/browse`

---

## 3. Data Flow

```
User types in search bar
  → debounce 300ms
  → set debouncedQuery state
  → useInfiniteQuery key changes: ['browse', debouncedQuery, type, genreId]
  → fetches page 1

User changes type or genre filter
  → update filter state
  → useInfiniteQuery key changes (includes filters)
  → fetches page 1 (previous pages discarded)

User scrolls to bottom
  → IntersectionObserver fires
  → fetchNextPage() from useInfiniteQuery
  → new page appended to existing data
```

**Query function logic:**
```
if (debouncedQuery) {
  // Search mode
  const results = await searchContent(debouncedQuery, pageParam);
  // Client-side filter if type or genre active
  return filterResults(results, type, genreId, genres);
} else {
  // Browse mode
  return browseContent({ type, genre_id: genreId, page: pageParam });
}
```

**Client-side filtering in search mode:** Since `searchContent` doesn't accept type/genre params, filter the `items` array after fetching. Match `item.type` against the type filter and check if `item.genre_ids` includes the selected `genreId`. This means `total`/`last_page` from the API may not reflect the filtered count, but for a testing project this is acceptable — infinite scroll will simply load more pages until content matching the filter is found.

---

## 4. Router & Nav Updates

**Router (`frontend/src/router/index.tsx`):**
- Replace the inline `BrowsePage` placeholder with an import of the real `BrowsePage` component
- Route path `/browse` stays the same (already wired)

**MainLayout (`frontend/src/layouts/MainLayout.tsx`):**
- Add a "Browse" `<Link to="/browse">` next to the "Home" link

---

## 5. Responsive Behavior

| Element | Desktop (1280px+) | Tablet (768px) | Mobile (<640px) |
|---|---|---|---|
| Search bar | max-w-2xl centered | full width | full width |
| Filter bar | inline row | inline row | stacked or scroll |
| Grid columns | 6 | 4 | 2 |
| Card size | auto from grid | auto from grid | auto from grid |

---

## 6. What is NOT in Scope

- **Year filter** — not implemented on backend
- **Language filter** — not implemented on backend
- **Sort options** (newest, popular, A-Z) — future enhancement
- **Full-text search on backend** (MongoDB Atlas Search) — current `LIKE` on title is sufficient for testing
- **Search suggestions / autocomplete** — future enhancement
- **Recent searches** — future enhancement
- **Global nav search** — search lives on the Browse page only
