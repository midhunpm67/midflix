import { Link } from 'react-router-dom';
import type { ContentListItem } from '@/types/content';

interface HeroBannerProps {
  content: ContentListItem | null;
  isLoading: boolean;
}

export default function HeroBanner({ content, isLoading }: HeroBannerProps) {
  if (isLoading) {
    return (
      <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-surface animate-pulse" />
    );
  }

  if (!content) {
    return (
      <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-background flex items-center justify-center">
        <p className="text-muted text-lg">No content available yet.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden">
      {(content.backdrop_url || content.poster_url) ? (
        <img
          src={content.backdrop_url ?? content.poster_url!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,10,0.95)] via-[rgba(10,10,10,0.6)] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex items-end pb-16 sm:pb-20 md:pb-24 px-6 md:px-12">
        <div className="max-w-lg">
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl tracking-wider text-white leading-none">
            {content.title}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted">
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
          </div>
          <div className="flex items-center gap-3 mt-5">
            <Link
              to={`/watch/${content.slug}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>&#9654;</span> Play
            </Link>
            <Link
              to={`/content/${content.slug}`}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              &#9432; More Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
