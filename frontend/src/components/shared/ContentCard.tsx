import { useState, useRef } from 'react';
// Link removed — cards now open modal instead of navigating
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/api/content';
import { useModalStore } from '@/stores/modalStore';
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
    showTimer.current = setTimeout(() => setShowPopup(true), 500);
  }

  function handleMouseLeave() {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setShowPopup(false), 250);
  }

  return (
    <div
      className="relative group/card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card thumbnail */}
      <button
        type="button"
        onClick={() => useModalStore.getState().openContentModal(item.slug)}
        className="relative aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-[#12121a] block w-full text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all duration-300 group-hover/card:ring-2 group-hover/card:ring-primary/40 group-hover/card:shadow-xl group-hover/card:shadow-primary/10 cursor-pointer"
      >
        {(item.poster_url || item.backdrop_url) ? (
          <img
            src={item.poster_url ?? item.backdrop_url!}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-500 ease-out group-hover/card:scale-105 group-hover/card:brightness-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a] flex items-center justify-center p-4">
            <span className="text-white/50 text-sm text-center font-medium leading-tight">{item.title}</span>
          </div>
        )}
        {/* Featured badge */}
        {item.is_featured && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 rounded-md shadow-lg shadow-amber-500/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Premium</span>
          </div>
        )}
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-16 pb-3 px-3">
          <p className="text-white text-[13px] font-bold leading-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {item.title}
          </p>
        </div>
        {/* Progress bar */}
        {progress != null && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-r-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </button>

      {/* Hover popup */}
      {showPopup && <HoverPopup item={item} />}
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
    <div className="absolute z-50 top-0 left-1/2 -translate-x-1/2 w-[300px] popup-enter pointer-events-auto">
      <div className="relative bg-[#12121a] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)]">
        {/* Backdrop image with cinematic overlay */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {(item.backdrop_url || item.poster_url) ? (
            <img
              src={item.backdrop_url ?? item.poster_url!}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#12121a]" />
          )}
          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12121a]/30 to-transparent" />

          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-1">
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-2">
              {item.title}
            </h3>
          </div>
        </div>

        {/* Content area */}
        <div className="px-5 pb-5 -mt-1">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {item.year && (
              <span className="text-[11px] text-white/60 font-medium">{item.year}</span>
            )}
            {item.rating && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="px-1.5 py-0.5 border border-white/15 rounded text-[10px] text-white/60 font-medium leading-none">
                  {item.rating}
                </span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[11px] text-white/60 font-medium capitalize">{item.type}</span>
          </div>

          {/* Genres */}
          {genreNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-2.5">
              {genreNames.map((name, i) => (
                <span key={name} className="text-[11px] text-white/40">
                  {i > 0 && <span className="text-white/15 mr-1.5">|</span>}
                  {name}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => useModalStore.getState().openContentModal(item.slug)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-[#0490c4] hover:from-[#06bdf4] hover:to-primary text-white rounded-xl text-[13px] font-bold transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <path d="M0 0v14l12-7z" />
              </svg>
              Watch Now
            </button>
            <button
              type="button"
              onClick={() => useModalStore.getState().openContentModal(item.slug)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white transition-all duration-200 ring-1 ring-white/[0.08] hover:ring-white/[0.15]"
              aria-label="More info"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>
  );
}
