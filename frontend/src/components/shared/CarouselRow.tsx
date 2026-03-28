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
