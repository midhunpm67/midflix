import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getGenres, browseContent } from '@/api/content';

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

  const { data: contentData } = useQuery({
    queryKey: ['browse-all'],
    queryFn: () => browseContent({ page: 1 }),
    staleTime: 60000,
  });

  const allContent = contentData?.items ?? [];

  function getImageForGenre(genreId: string): string | null {
    const match = allContent.find((item) =>
      item.genre_ids.includes(genreId) && (item.poster_url || item.backdrop_url)
    );
    return match?.poster_url ?? match?.backdrop_url ?? null;
  }

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
            const image = getImageForGenre(genre.id);

            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => navigate(`/browse?genre=${genre.id}`)}
                style={{ scrollSnapAlign: 'start' }}
                className="flex-shrink-0 w-[150px] sm:w-[160px] md:w-[175px] lg:w-[190px] xl:w-[200px] rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none group/genre relative"
              >
                <div className="relative aspect-[3/4]">
                  {/* Background image */}
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover/genre:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#141420]" />
                  )}

                  {/* Color tint overlay */}
                  <div
                    className="absolute inset-0 opacity-40 group-hover/genre:opacity-25 transition-opacity duration-300 mix-blend-color"
                    style={{ backgroundColor: accent }}
                  />

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                  {/* Accent top edge glow */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover/genre:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                  />

                  {/* Genre name */}
                  <div className="absolute inset-0 flex items-end p-4">
                    <div>
                      <span
                        className="text-[15px] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                        style={{ color: accent }}
                      >
                        {genre.name}
                      </span>
                    </div>
                  </div>

                  {/* Hover ring */}
                  <div
                    className="absolute inset-0 rounded-xl ring-0 group-hover/genre:ring-1 transition-all duration-300 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 0px ${accent}`, transition: 'box-shadow 0.3s' }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${accent}40`; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = `inset 0 0 0 0px ${accent}`; }}
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
