import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContentBySlug, getContentSeasons, getSeasonEpisodes, getGenres } from '@/api/content';
import type { Season } from '@/types/content';

export default function ContentDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['content', slug],
    queryFn: () => getContentBySlug(slug!),
    enabled: !!slug,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['content-seasons', slug],
    queryFn: () => getContentSeasons(slug!),
    enabled: !!slug && content?.type === 'series',
  });

  const firstSeasonId = seasons.length > 0 ? seasons[0].id : null;

  const { data: firstSeasonEpisodes = [] } = useQuery({
    queryKey: ['season-episodes', firstSeasonId],
    queryFn: () => getSeasonEpisodes(firstSeasonId!),
    enabled: !!firstSeasonId,
  });

  const firstEpisodeId = firstSeasonEpisodes.length > 0 ? firstSeasonEpisodes[0].id : null;

  const genreNames = content
    ? content.genre_ids
        .map((id) => genres.find((g) => g.id === id)?.name)
        .filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="-mt-16">
        <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-surface animate-pulse" />
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          <div className="h-10 w-64 bg-surface rounded animate-pulse" />
          <div className="h-4 w-40 bg-surface rounded animate-pulse" />
          <div className="h-20 w-full bg-surface rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted text-lg">Content not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  const playUrl = content.type === 'series' && firstEpisodeId
    ? `/watch/${content.slug}/episode/${firstEpisodeId}`
    : `/watch/${content.slug}`;

  const canPlay = content.type === 'movie' || (content.type === 'series' && !!firstEpisodeId);

  return (
    <div className="-mt-16">
      {/* Backdrop */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        {content.backdrop_url ? (
          <img
            src={content.backdrop_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,10,0.95)] via-[rgba(10,10,10,0.6)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Info section */}
      <div className="relative z-10 -mt-32 px-6 md:px-12 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl tracking-wider text-white leading-none">
          {content.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-muted">
          {content.year && <span>{content.year}</span>}
          {content.rating && (
            <>
              <span className="text-surface-variant">·</span>
              <span className="border border-muted/50 px-1.5 py-0.5 text-xs rounded">
                {content.rating}
              </span>
            </>
          )}
          <span className="text-surface-variant">·</span>
          <span className="capitalize">{content.type}</span>
          {genreNames.length > 0 && (
            <>
              <span className="text-surface-variant">·</span>
              <span>{genreNames.join(', ')}</span>
            </>
          )}
        </div>

        <div className="mt-5">
          {canPlay ? (
            <Link
              to={playUrl}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 bg-primary/50 text-white/70 px-6 py-2.5 rounded font-semibold text-sm cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </button>
          )}
        </div>

        <p className="text-white/80 text-sm leading-relaxed mt-6">{content.description}</p>

        {content.director && (
          <p className="text-muted text-sm mt-3">
            Director: <span className="text-white/70">{content.director}</span>
          </p>
        )}
        {content.cast.length > 0 && (
          <p className="text-muted text-sm mt-1">
            Cast: <span className="text-white/70">{content.cast.join(', ')}</span>
          </p>
        )}
      </div>

      {/* Seasons & Episodes (series only) */}
      {content.type === 'series' && seasons.length > 0 && (
        <div className="px-6 md:px-12 max-w-3xl mt-10 pb-12">
          <h2 className="text-white text-lg font-semibold mb-4">Seasons</h2>
          <div className="space-y-2">
            {seasons.map((season, index) => (
              <SeasonAccordion
                key={season.id}
                season={season}
                contentSlug={content.slug}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SeasonAccordionProps {
  season: Season;
  contentSlug: string;
  defaultOpen: boolean;
}

function SeasonAccordion({ season, contentSlug, defaultOpen }: SeasonAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['season-episodes', season.id],
    queryFn: () => getSeasonEpisodes(season.id),
    enabled: open,
  });

  return (
    <div className="border border-surface-variant rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-variant/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="text-white text-sm font-medium">
          Season {season.number}{season.title ? ` — ${season.title}` : ''}
        </span>
        <span className="text-muted text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bg-background">
          {isLoading ? (
            <div className="px-4 py-3 text-muted text-sm">Loading episodes...</div>
          ) : episodes.length === 0 ? (
            <div className="px-4 py-3 text-muted text-sm">No episodes yet.</div>
          ) : (
            episodes.map((ep) => (
              <Link
                key={ep.id}
                to={`/watch/${contentSlug}/episode/${ep.id}`}
                className="flex items-center gap-4 px-4 py-3 border-t border-surface-variant/50 text-sm hover:bg-surface-variant/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <span className="text-muted w-6 text-right flex-shrink-0">
                  {ep.number}
                </span>
                <span className="text-white flex-1">{ep.title}</span>
                {ep.duration != null && (
                  <span className="text-muted text-xs">{ep.duration}m</span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
