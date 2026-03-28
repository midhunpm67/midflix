import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getGenres, browseContent } from '@/api/content';
import type { Genre } from '@/types/content';

const GENRE_COLORS: Record<string, string> = {
  action: 'from-red-600/80 to-red-900/60',
  adventure: 'from-amber-600/80 to-amber-900/60',
  animation: 'from-violet-500/80 to-violet-800/60',
  comedy: 'from-yellow-500/80 to-yellow-800/60',
  crime: 'from-slate-600/80 to-slate-900/60',
  documentary: 'from-emerald-600/80 to-emerald-900/60',
  drama: 'from-blue-600/80 to-blue-900/60',
  fantasy: 'from-purple-500/80 to-purple-800/60',
  horror: 'from-zinc-700/80 to-zinc-900/60',
  mystery: 'from-indigo-600/80 to-indigo-900/60',
  romance: 'from-pink-500/80 to-pink-800/60',
  'sci-fi': 'from-cyan-600/80 to-cyan-900/60',
  thriller: 'from-orange-600/80 to-orange-900/60',
  western: 'from-amber-700/80 to-amber-950/60',
};

function getColorForGenre(slug: string): string {
  return GENRE_COLORS[slug] ?? 'from-primary/60 to-primary/30';
}

export default function GenreCards() {
  const navigate = useNavigate();

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

  function getImageForGenre(genre: Genre): string | null {
    const match = allContent.find((item) =>
      item.genre_ids.includes(genre.id) && (item.backdrop_url || item.poster_url)
    );
    return match?.backdrop_url ?? match?.poster_url ?? null;
  }

  function handleClick(genreId: string) {
    navigate(`/browse?genre=${genreId}`);
  }

  if (genres.length === 0) return null;

  return (
    <section className="px-5 md:px-10 mb-8">
      <h2 className="text-white text-base font-bold mb-4">Popular Genres</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
        {genres.map((genre) => {
          const image = getImageForGenre(genre);
          const colors = getColorForGenre(genre.slug);

          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => handleClick(genre.id)}
              className="relative aspect-[16/9] rounded-xl overflow-hidden group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {/* Background image */}
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-surface" />
              )}

              {/* Color overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colors} mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Genre name */}
              <div className="absolute inset-0 flex items-end p-3">
                <span className="text-white font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {genre.name}
                </span>
              </div>

              {/* Hover border */}
              <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 ring-white/40 transition-all duration-300 pointer-events-none" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
