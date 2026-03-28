import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getGenres } from '@/api/content';

const GENRE_ACCENTS: Record<string, string> = {
  action:      '#ef4444',
  adventure:   '#eab308',
  animation:   '#a78bfa',
  comedy:      '#facc15',
  crime:       '#94a3b8',
  documentary: '#34d399',
  drama:       '#3b82f6',
  fantasy:     '#c084fc',
  horror:      '#71717a',
  mystery:     '#818cf8',
  romance:     '#f472b6',
  'sci-fi':    '#22d3ee',
  thriller:    '#f97316',
  western:     '#d97706',
};

function getAccent(slug: string): string {
  return GENRE_ACCENTS[slug] ?? '#05ace5';
}

export default function GenreCards() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: 60000,
  });

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
  }, [genres]);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: 'smooth',
    });
  }

  if (genres.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-white text-base font-bold mb-3 px-5 md:px-10">Popular Genres</h2>
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
          {genres.map((genre) => {
            const accent = getAccent(genre.slug);

            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => navigate(`/browse?genre=${genre.id}`)}
                style={{ scrollSnapAlign: 'start' }}
                className="flex-shrink-0 w-[150px] sm:w-[160px] md:w-[175px] lg:w-[190px] xl:w-[200px] rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none group/genre relative"
              >
                <div
                  className="relative aspect-[3/4] flex flex-col items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}08)` }}
                >
                  {/* Accent glow */}
                  <div
                    className="absolute w-20 h-20 rounded-full blur-3xl opacity-20 group-hover/genre:opacity-40 transition-opacity duration-500"
                    style={{ backgroundColor: accent }}
                  />

                  {/* Genre name */}
                  <span
                    className="relative text-base font-bold"
                    style={{ color: accent }}
                  >
                    {genre.name}
                  </span>

                  {/* Top glow line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover/genre:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                  />

                  {/* Border */}
                  <div
                    className="absolute inset-0 rounded-xl transition-all duration-300"
                    style={{ boxShadow: `inset 0 0 0 1px ${accent}15` }}
                  />
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover/genre:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }}
                  />
                </div>
              </button>
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
