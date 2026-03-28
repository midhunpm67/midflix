import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/api/content';
import type { ContentListItem } from '@/types/content';

interface ContentCardProps {
  item: ContentListItem;
  progress?: number;
}

export default function ContentCard({ item, progress }: ContentCardProps) {
  const [showPopup, setShowPopup] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function handleMouseEnter() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => setShowPopup(true), 400);
  }

  function handleMouseLeave() {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setShowPopup(false), 200);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card thumbnail */}
      <Link
        to={`/content/${item.slug}`}
        className="group relative aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-surface block focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {(item.poster_url || item.backdrop_url) ? (
          <img
            src={item.poster_url ?? item.backdrop_url!}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-variant to-surface flex items-center justify-center p-4">
            <span className="text-white/60 text-sm text-center font-medium leading-tight">{item.title}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-3">
          <p className="text-white text-[13px] font-semibold leading-tight line-clamp-2 drop-shadow-lg">{item.title}</p>
        </div>
        <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 ring-white/30 transition-all duration-300 pointer-events-none" />
        {progress != null && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary rounded-r-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </Link>

      {/* Hover popup */}
      {showPopup && (
        <HoverPopup item={item} />
      )}
    </div>
  );
}

function HoverPopup({ item }: { item: ContentListItem }) {
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: 60000,
  });

  const genreNames = item.genre_ids
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="absolute z-50 top-0 left-1/2 -translate-x-1/2 w-[280px] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
      <div className="bg-[#181820] rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
        {/* Poster image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {(item.backdrop_url || item.poster_url) ? (
            <img
              src={item.backdrop_url ?? item.poster_url!}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-variant to-surface" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181820] via-transparent to-transparent" />
          <h3 className="absolute bottom-3 left-4 right-4 text-white font-bold text-base leading-tight drop-shadow-lg line-clamp-2">
            {item.title}
          </h3>
        </div>

        {/* Details */}
        <div className="px-4 pb-4 -mt-1">
          {/* Watch Now button */}
          <Link
            to={`/content/${item.slug}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-semibold transition-colors mt-2"
          >
            <span className="text-xs">&#9654;</span>
            Watch Now
          </Link>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-white/50">
            {item.year && <span>{item.year}</span>}
            {item.rating && (
              <>
                <span className="text-white/20">&#183;</span>
                <span className="px-1 py-0.5 border border-white/20 rounded text-[10px] leading-none">{item.rating}</span>
              </>
            )}
            <span className="text-white/20">&#183;</span>
            <span className="capitalize">{item.type}</span>
          </div>

          {/* Genres */}
          {genreNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2 text-[11px] text-white/40">
              {genreNames.map((name, i) => (
                <span key={name}>
                  {i > 0 && <span className="text-white/20 mx-0.5">|</span>}
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
