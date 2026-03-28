# Phase 4 — Browse & Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing Home page (hero banner + carousel rows) and Content Detail page so subscribers can browse and view content.

**Architecture:** Purely frontend — no backend changes. Three shared components (ContentCard, CarouselRow, HeroBanner) compose into two pages (HomePage, ContentDetailPage). Data comes from the existing TanStack Query + API client layer built in Phase 2.

**Tech Stack:** React 19, TanStack Query v5, React Router v6, Tailwind CSS, TypeScript

---

## File Map

```
frontend/src/
├── components/shared/
│   ├── ContentCard.tsx            (create — portrait poster card)
│   ├── CarouselRow.tsx            (create — horizontal scroll row with arrows)
│   └── HeroBanner.tsx             (create — full-bleed hero section)
├── pages/
│   ├── HomePage.tsx               (create — hero + 2 carousel rows)
│   └── ContentDetailPage.tsx      (create — content info + episodes for series)
├── layouts/
│   └── MainLayout.tsx             (modify — add Home nav link)
└── router/
    └── index.tsx                  (modify — wire new pages + content/:slug route)
```

---

## Task 1: ContentCard Component

**Files:**
- Create: `frontend/src/components/shared/ContentCard.tsx`

- [ ] **Step 1: Create the ContentCard component**

```tsx
import { Link } from 'react-router-dom';
import type { ContentListItem } from '@/types/content';

interface ContentCardProps {
  item: ContentListItem;
}

export default function ContentCard({ item }: ContentCardProps) {
  return (
    <Link
      to={`/content/${item.slug}`}
      className="group relative aspect-[2/3] rounded-card overflow-hidden flex-shrink-0 bg-surface block"
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
    </Link>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/components/shared/ContentCard.tsx
git commit -m "feat: add ContentCard component with portrait poster and hover overlay"
```

---

## Task 2: CarouselRow Component

**Files:**
- Create: `frontend/src/components/shared/CarouselRow.tsx`

- [ ] **Step 1: Create the CarouselRow component**

```tsx
import { useRef, useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import type { ContentListItem } from '@/types/content';

interface CarouselRowProps {
  title: string;
  items: ContentListItem[];
  isLoading?: boolean;
}

export default function CarouselRow({ title, items, isLoading = false }: CarouselRowProps) {
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

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-white text-lg font-semibold mb-3 px-6 md:px-12">{title}</h2>
      <div className="group/carousel relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-opacity opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
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
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-card bg-surface animate-pulse flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                />
              ))
            : items.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ContentCard item={item} />
                </div>
              ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-opacity opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
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

- [ ] **Step 2: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/components/shared/CarouselRow.tsx
git commit -m "feat: add CarouselRow component with horizontal scroll and arrow navigation"
```

---

## Task 3: HeroBanner Component

**Files:**
- Create: `frontend/src/components/shared/HeroBanner.tsx`

- [ ] **Step 1: Create the HeroBanner component**

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
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
            >
              <span>&#9654;</span> Play
            </Link>
            <Link
              to={`/content/${content.slug}`}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded font-medium text-sm transition-colors"
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

- [ ] **Step 2: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/components/shared/HeroBanner.tsx
git commit -m "feat: add HeroBanner component with backdrop gradient and CTA buttons"
```

---

## Task 4: HomePage

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: Create the HomePage component**

```tsx
import { useQuery } from '@tanstack/react-query';
import HeroBanner from '@/components/shared/HeroBanner';
import CarouselRow from '@/components/shared/CarouselRow';
import { getTrending, getNewReleases } from '@/api/content';

export default function HomePage() {
  const { data: newReleases = [], isLoading: loadingNew } = useQuery({
    queryKey: ['new-releases'],
    queryFn: getNewReleases,
  });

  const { data: trending = [], isLoading: loadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
  });

  const heroContent = newReleases.length > 0 ? newReleases[0] : null;

  return (
    <div className="-mt-16">
      <HeroBanner content={heroContent} isLoading={loadingNew} />
      <div className="relative z-10 -mt-16 space-y-2">
        <CarouselRow
          title="Trending Now"
          items={trending}
          isLoading={loadingTrending}
        />
        <CarouselRow
          title="New Releases"
          items={newReleases}
          isLoading={loadingNew}
        />
      </div>
    </div>
  );
}
```

The `-mt-16` on the outer div removes the `pt-16` padding from MainLayout so the hero sits behind the nav bar. The carousels overlap the hero bottom with `-mt-16` and `relative z-10`.

- [ ] **Step 2: Run TypeScript check**

Run: `source ~/.nvm/nvm.sh && nvm use 22 && cd /var/www/html/MidFlix/frontend && npx tsc --noEmit`

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd /var/www/html/MidFlix/frontend
git add src/pages/HomePage.tsx
git commit -m "feat: add HomePage with hero banner and trending/new releases carousels"
```

---

## Task 5: ContentDetailPage

**Files:**
- Create: `frontend/src/pages/ContentDetailPage.tsx`

- [ ] **Step 1: Create the ContentDetailPage component**

This is the largest component. It handles both movies and series, with lazy-loading episodes for series.

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
          <Link
            to={`/watch/${content.slug}`}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
          >
            <span>&#9654;</span> Play
          </Link>
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
  defaultOpen: boolean;
}

function SeasonAccordion({ season, defaultOpen }: SeasonAccordionProps) {
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
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-variant/50 transition-colors text-left"
      >
        <span className="text-white text-sm font-medium">
          Season {season.number}{season.title ? ` — ${season.title}` : ''}
        </span>
        <span className="text-muted text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bg-background">
          {isLoading ? (
            <div className="px-4 py-3 text-muted text-sm">Loading episodes…</div>
          ) : episodes.length === 0 ? (
            <div className="px-4 py-3 text-muted text-sm">No episodes yet.</div>
          ) : (
            episodes.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center gap-4 px-4 py-3 border-t border-surface-variant/50 text-sm"
              >
                <span className="text-muted w-6 text-right flex-shrink-0">
                  {ep.number}
                </span>
                <span className="text-white flex-1">{ep.title}</span>
                {ep.duration != null && (
                  <span className="text-muted text-xs">{ep.duration}m</span>
                )}
              </div>
            ))
          )}
        </div>
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
git add src/pages/ContentDetailPage.tsx
git commit -m "feat: add ContentDetailPage with backdrop, info, and season/episode accordion"
```

---

## Task 6: Router Updates + MainLayout Nav Link

**Files:**
- Modify: `frontend/src/router/index.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`

- [ ] **Step 1: Update the router to use real pages and add content/:slug route**

In `frontend/src/router/index.tsx`:

Replace the full file content. The key changes:
- Remove inline `HomePage` placeholder
- Import `HomePage` and `ContentDetailPage`
- Add `content/:slug` route inside the subscriber group

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

  // Subscriber routes
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

- [ ] **Step 2: Update MainLayout to add a Home nav link**

In `frontend/src/layouts/MainLayout.tsx`, add a Link import and a Home link in the nav. Replace the file content:

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
git commit -m "feat: wire HomePage and ContentDetailPage routes, add Home nav link"
```

---

## Dependency Graph

```
Task 1 (ContentCard) ─── Task 2 (CarouselRow) ─── Task 4 (HomePage)
                                                         │
Task 3 (HeroBanner) ────────────────────────────────────┘

Task 5 (ContentDetailPage) — independent of Tasks 1-4

Task 6 (Router + Nav) — depends on Tasks 4 and 5
```

Tasks 1, 3, and 5 can be built independently. Task 2 depends on Task 1. Task 4 depends on Tasks 2 and 3. Task 6 depends on Tasks 4 and 5.
