import { useState, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { browseContent, searchContent, getGenres } from '@/api/content';
import ContentGrid from '@/components/shared/ContentGrid';
import type { ContentType } from '@/types/content';

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
        return searchContent(debouncedQuery, pageParam as number);
      }
      return browseContent({ type: typeFilter, genre_id: genreFilter, page: pageParam as number });
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
