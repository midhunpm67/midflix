import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContentBySlug, getContentSeasons, getSeasonEpisodes, getGenres, getTrending } from '@/api/content';
import { useModalStore } from '@/stores/modalStore';
import ContentCard from './ContentCard';
import type { Season } from '@/types/content';

export default function ContentModal() {
  const { slug, isOpen, closeContentModal } = useModalStore();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeContentModal();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, closeContentModal]);

  if (!isOpen || !slug) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm modal-fade-in"
        onClick={closeContentModal}
      />

      {/* Modal container */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex justify-center pt-10 pb-20 px-4">
          <div className="relative w-full max-w-[900px] modal-slide-up">
            <ModalContent slug={slug} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalContent({ slug }: { slug: string }) {
  const { closeContentModal } = useModalStore();

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', slug],
    queryFn: () => getContentBySlug(slug),
  });

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: 60000,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['content-seasons', slug],
    queryFn: () => getContentSeasons(slug),
    enabled: !!content && content.type === 'series',
  });

  const { data: suggested = [] } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
    staleTime: 60000,
  });

  const genreNames = content
    ? content.genre_ids.map((id) => genres.find((g) => g.id === id)?.name).filter(Boolean)
    : [];

  // Filter out current content from suggestions
  const moreLikeThis = suggested.filter((item) => item.slug !== slug).slice(0, 6);

  if (isLoading) {
    return (
      <div className="bg-[#0f0f18] rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">
        <div className="aspect-[16/8] bg-[#16162a] animate-pulse" />
        <div className="p-8 space-y-4">
          <div className="h-8 w-64 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-20 w-full bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-[#0f0f18] rounded-2xl p-12 text-center ring-1 ring-white/[0.06]">
        <p className="text-white/40 text-lg">Content not found</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f18] rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">
      {/* Close button */}
      <button
        onClick={closeContentModal}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white flex items-center justify-center transition-colors backdrop-blur-sm"
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Hero backdrop */}
      <div className="relative aspect-[16/8] overflow-hidden">
        {content.backdrop_url ? (
          <img
            src={content.backdrop_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : content.poster_url ? (
          <img
            src={content.poster_url}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#0f0f18]" />
        )}
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f18] via-[#0f0f18]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f18]/50 to-transparent" />
      </div>

      {/* Content info */}
      <div className="px-8 md:px-10 -mt-20 relative z-10">
        {/* Title */}
        <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {content.title}
        </h2>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {content.year && (
            <span className="text-white/70 text-sm font-medium">{content.year}</span>
          )}
          {content.rating && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="px-2 py-0.5 border border-white/20 rounded text-xs text-white/70 font-medium">
                {content.rating}
              </span>
            </>
          )}
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-white/70 text-sm capitalize">{content.type}</span>
        </div>

        {/* Description */}
        <p className="text-white/60 text-sm leading-relaxed mt-4 max-w-[600px]">
          {content.description}
        </p>

        {/* Genres */}
        {genreNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-4">
            {genreNames.map((name, i) => (
              <span key={name} className="text-sm text-white/50">
                {i > 0 && <span className="text-white/20 mr-2">|</span>}
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Director & Cast */}
        {content.director && (
          <p className="text-white/40 text-xs mt-4">
            Director: <span className="text-white/60">{content.director}</span>
          </p>
        )}
        {content.cast.length > 0 && (
          <p className="text-white/40 text-xs mt-1">
            Cast: <span className="text-white/60">{content.cast.join(', ')}</span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-6">
          <Link
            to={content.type === 'series' ? `/content/${content.slug}` : `/watch/${content.slug}`}
            onClick={closeContentModal}
            className="flex items-center justify-center gap-2.5 px-8 py-3 bg-gradient-to-r from-primary to-[#0490c4] hover:from-[#06bdf4] hover:to-primary text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <path d="M0 0v14l12-7z" />
            </svg>
            Watch Now
          </Link>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white transition-all duration-200 ring-1 ring-white/[0.08] hover:ring-white/[0.15]"
            aria-label="Add to list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seasons & Episodes for series */}
      {content.type === 'series' && seasons.length > 0 && (
        <div className="px-8 md:px-10 mt-10">
          <div className="border-t border-white/[0.06] pt-8">
            <h3 className="text-white text-lg font-bold mb-4">Episodes</h3>
            <div className="space-y-1">
              {seasons.map((season) => (
                <SeasonBlock key={season.id} season={season} contentSlug={content.slug} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* More Like This */}
      {moreLikeThis.length > 0 && (
        <div className="px-8 md:px-10 mt-10 pb-8">
          <div className="border-t border-white/[0.06] pt-8">
            <h3 className="text-white text-lg font-bold mb-5">More Like This</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {moreLikeThis.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeasonBlock({ season, contentSlug }: { season: Season; contentSlug: string }) {
  const { closeContentModal } = useModalStore();

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['season-episodes', season.id],
    queryFn: () => getSeasonEpisodes(season.id),
  });

  return (
    <div>
      <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
        Season {season.number}{season.title ? ` — ${season.title}` : ''}
      </div>
      {isLoading ? (
        <div className="text-white/30 text-sm py-3">Loading episodes...</div>
      ) : episodes.length === 0 ? (
        <div className="text-white/30 text-sm py-3">No episodes yet</div>
      ) : (
        <div className="space-y-px mb-4">
          {episodes.map((ep) => (
            <Link
              key={ep.id}
              to={`/watch/${contentSlug}/episode/${ep.id}`}
              onClick={closeContentModal}
              className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.04] transition-colors group"
            >
              <span className="text-white/30 text-sm w-6 text-right flex-shrink-0 tabular-nums">
                {ep.number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-medium truncate group-hover:text-white transition-colors">
                  {ep.title}
                </p>
                {ep.description && (
                  <p className="text-white/30 text-xs mt-0.5 line-clamp-1">{ep.description}</p>
                )}
              </div>
              {ep.duration != null && (
                <span className="text-white/30 text-xs flex-shrink-0">{ep.duration}m</span>
              )}
              <svg className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors flex-shrink-0" viewBox="0 0 12 14" fill="currentColor">
                <path d="M0 0v14l12-7z" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
