import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getGenres } from '@/api/content';

const GENRE_COLORS: Record<string, string> = {
  action: 'bg-red-400/20 text-red-300',
  adventure: 'bg-amber-400/20 text-amber-300',
  animation: 'bg-violet-400/20 text-violet-300',
  comedy: 'bg-yellow-400/20 text-yellow-300',
  crime: 'bg-slate-400/20 text-slate-300',
  documentary: 'bg-emerald-400/20 text-emerald-300',
  drama: 'bg-blue-400/20 text-blue-300',
  fantasy: 'bg-purple-400/20 text-purple-300',
  horror: 'bg-zinc-400/20 text-zinc-300',
  mystery: 'bg-indigo-400/20 text-indigo-300',
  romance: 'bg-pink-400/20 text-pink-300',
  'sci-fi': 'bg-cyan-400/20 text-cyan-300',
  thriller: 'bg-orange-400/20 text-orange-300',
  western: 'bg-amber-500/20 text-amber-300',
};

function getColorForGenre(slug: string): string {
  return GENRE_COLORS[slug] ?? 'bg-primary/20 text-primary';
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
                className={`flex-shrink-0 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 hover:scale-105 hover:brightness-125 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${colors}`}
              >
                {genre.name}
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
