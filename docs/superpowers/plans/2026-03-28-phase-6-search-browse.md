# Phase 6 — Search & Browse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Browse page with search, genre/type filters, a responsive content grid, and infinite scroll pagination. No backend changes — all APIs exist from Phase 2.

**Architecture:** Purely frontend. One new shared component (ContentGrid), one new page (BrowsePage), and minor updates to the router and MainLayout. Uses TanStack Query's `useInfiniteQuery` for page accumulation and `IntersectionObserver` for infinite scroll.

**Tech Stack:** React 19, TanStack Query v5, Tailwind CSS, TypeScript

---

## File Map

```
frontend/src/
├── components/shared/
│   └── ContentGrid.tsx             (create — responsive grid of ContentCards)
├── pages/
│   └── BrowsePage.tsx              (create — search + filters + grid + infinite scroll)
├── layouts/
│   └── MainLayout.tsx              (modify — add Browse nav link)
└── router/
    └── index.tsx                   (modify — replace BrowsePage placeholder with import)
```

---

## Task 1: ContentGrid Component

**Files:**
- Create: `frontend/src/components/shared/ContentGrid.tsx`

- [ ] **Step 1: Create the ContentGrid component**

```tsx
import ContentCard from './ContentCard';
import type { ContentListItem } from '@/types/content';

interface ContentGridProps {
  items: ContentListItem[];
  isLoading: boolean;
}

export default function ContentGrid({ items, isLoading }: ContentGridProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-card bg-surface animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/components/shared/ContentGrid.tsx
git commit -m "feat: add ContentGrid component with responsive grid and skeleton loading"
```

---

## Task 2: BrowsePage with Search, Filters, and Infinite Scroll

**Files:**
- Create: `frontend/src/pages/BrowsePage.tsx`

- [ ] **Step 1: Create the BrowsePage component**

This is the main component for the phase. It manages search state, filter state, uses `useInfiniteQuery` for pagination, and renders the grid with an `IntersectionObserver` sentinel for infinite scroll.

```tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { browseContent, searchContent, getGenres } from '@/api/content';
import ContentGrid from '@/components/shared/ContentGrid';
import type { ContentListItem, ContentType, Genre, PaginatedResponse } from '@/types/content';

const DEBOUNCE_MS = 300;

export default function BrowsePage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | undefined>(undefined);
  const [genreFilter, setGenreFilter] = useState<string | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch genres for filter dropdown
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  // Infinite query for browse/search
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['browse', debouncedQuery, typeFilter, genreFilter],
    queryFn: async ({ pageParam = 1 }) => {
      if (debouncedQuery) {
        return searchContent(debouncedQuery, pageParam);
      }
      return browseContent({ type: typeFilter, genre_id: genreFilter, page: pageParam });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.current_page < lastPage.last_page) {
        return lastPage.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into a single items array
  const allItems = useMemo(() => {
    if (!data) return [];
    let items = data.pages.flatMap((page) => page.items);
    // Client-side filtering when in search mode (search API doesn't accept type/genre filters)
    if (debouncedQuery) {
      if (typeFilter) {
        items = items.filter((item) => item.type === typeFilter);
      }
      if (genreFilter) {
        items = items.filter((item) => item.genre_ids.includes(genreFilter));
      }
    }
    return items;
  }, [data, debouncedQuery, typeFilter, genreFilter]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleTypeChange(type: ContentType | undefined) {
    setTypeFilter(type);
  }

  function handleGenreChange(genreId: string | undefined) {
    setGenreFilter(genreId);
  }

  const isAtEnd = data && !hasNextPage && allItems.length > 0;

  return (
    <div className="px-6 md:px-12 py-6">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search movies and series..."
            className="w-full bg-surface border border-surface-variant text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Type toggle */}
        <div className="flex items-center gap-1">
          {([undefined, 'movie', 'series'] as const).map((type) => {
            const label = type === undefined ? 'All' : type === 'movie' ? 'Movies' : 'Series';
            const isActive = typeFilter === type;
            return (
              <button
                key={label}
                onClick={() => handleTypeChange(type as ContentType | undefined)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-surface text-muted hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Genre dropdown */}
        <select
          value={genreFilter ?? ''}
          onChange={(e) => handleGenreChange(e.target.value || undefined)}
          className="bg-surface border border-surface-variant text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted text-lg">Something went wrong.</p>
          <button
            onClick={() => refetch()}
            className="text-primary hover:underline text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content grid */}
      {!isError && (
        <>
          <ContentGrid items={allItems} isLoading={isLoading} />

          {/* Empty state */}
          {!isLoading && allItems.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted text-lg">
                {debouncedQuery
                  ? `No results for "${debouncedQuery}"`
                  : 'No results found.'}
              </p>
            </div>
          )}

          {/* Loading more spinner */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* End of results */}
          {isAtEnd && (
            <p className="text-center text-muted/60 text-sm py-8">
              You've seen it all
            </p>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/pages/BrowsePage.tsx
git commit -m "feat: add BrowsePage with search, type/genre filters, and infinite scroll"
```

---

## Task 3: Router Update + MainLayout Browse Nav Link

**Files:**
- Modify: `frontend/src/router/index.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`

- [ ] **Step 1: Update the router to use the real BrowsePage**

In `frontend/src/router/index.tsx`:

1. Add the import at the top (after the `ContentDetailPage` import):
```tsx
import BrowsePage from '@/pages/BrowsePage'
```

2. Remove the inline `BrowsePage` placeholder. The line that says:
```tsx
const BrowsePage = () => <div className="p-8 text-white">Browse — Phase 6</div>
```
Delete it.

The route `{ path: '/browse', element: <BrowsePage /> }` stays the same — it now uses the imported component.

The full updated file:

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
import BrowsePage from '@/pages/BrowsePage'

// Placeholder pages — replaced in later phases
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

- [ ] **Step 2: Add Browse link to MainLayout**

In `frontend/src/layouts/MainLayout.tsx`, add a "Browse" link next to "Home". Replace the full file:

```tsx
import { Link, Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/60 backdrop-blur-[30px]">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-display text-2xl tracking-widest text-primary">
              MIDFLIX
            </Link>
            <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/browse" className="text-sm text-white/70 hover:text-white transition-colors">
              Browse
            </Link>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/router/index.tsx src/layouts/MainLayout.tsx
git commit -m "feat: wire BrowsePage route and add Browse nav link to MainLayout"
```

---

## Dependency Graph

```
Task 1 (ContentGrid) ─── Task 2 (BrowsePage)
                              │
Task 3 (Router + Nav) ────────┘
```

Task 1 must be done before Task 2 (BrowsePage imports ContentGrid). Task 3 depends on Task 2 (imports BrowsePage).
