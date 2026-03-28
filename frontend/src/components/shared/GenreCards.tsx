import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getGenres } from '@/api/content';

const GENRE_COLORS: Record<string, string> = {
  action: 'from-red-500/30 to-red-900/40 text-red-200',
  adventure: 'from-amber-500/30 to-amber-900/40 text-amber-200',
  animation: 'from-violet-500/30 to-violet-900/40 text-violet-200',
  comedy: 'from-yellow-500/30 to-yellow-900/40 text-yellow-200',
  crime: 'from-slate-400/30 to-slate-800/40 text-slate-200',
  documentary: 'from-emerald-500/30 to-emerald-900/40 text-emerald-200',
  drama: 'from-blue-500/30 to-blue-900/40 text-blue-200',
  fantasy: 'from-purple-500/30 to-purple-900/40 text-purple-200',
  horror: 'from-zinc-500/30 to-zinc-900/40 text-zinc-200',
  mystery: 'from-indigo-500/30 to-indigo-900/40 text-indigo-200',
  romance: 'from-pink-500/30 to-pink-900/40 text-pink-200',
  'sci-fi': 'from-cyan-500/30 to-cyan-900/40 text-cyan-200',
  thriller: 'from-orange-500/30 to-orange-900/40 text-orange-200',
  western: 'from-amber-600/30 to-amber-950/40 text-amber-200',
};

function getColorForGenre(slug: string): string {
  return GENRE_COLORS[slug] ?? 'from-primary/30 to-primary/50 text-primary';
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
            const colors = getColorForGenre(genre.slug);
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => navigate(`/browse?genre=${genre.id}`)}
                style={{ scrollSnapAlign: 'start' }}
                className={`flex-shrink-0 w-[150px] sm:w-[160px] md:w-[175px] lg:w-[190px] xl:w-[200px] rounded-xl bg-gradient-to-br ring-1 ring-white/[0.06] transition-all duration-200 hover:scale-105 hover:ring-white/20 hover:brightness-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${colors}`}
              >
                <div className="flex items-center justify-center aspect-[4/3]">
                  <span className="font-bold text-sm sm:text-base drop-shadow-sm">{genre.name}</span>
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
