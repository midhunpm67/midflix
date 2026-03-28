import { useQuery } from '@tanstack/react-query';
import HeroBanner from '@/components/shared/HeroBanner';
import CarouselRow from '@/components/shared/CarouselRow';
import GenreCards from '@/components/shared/GenreCards';
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
        <GenreCards />
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
    <section className="mb-6">
      <h2 className="text-white text-base font-bold mb-3 px-5 md:px-10">Continue Watching</h2>
      <div className="group/carousel relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex focus-visible:outline-none"
            aria-label="Scroll left"
          >
            <span className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors">&#8249;</span>
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-2 overflow-x-auto px-5 md:px-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
              is_featured: false,
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
                className="flex-shrink-0 w-[150px] sm:w-[160px] md:w-[175px] lg:w-[190px] xl:w-[200px]"
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
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background/90 to-transparent flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex focus-visible:outline-none"
            aria-label="Scroll right"
          >
            <span className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors">&#8250;</span>
          </button>
        )}
      </div>
    </section>
  );
}
