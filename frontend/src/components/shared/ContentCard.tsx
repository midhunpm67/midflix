import { Link } from 'react-router-dom';
import type { ContentListItem } from '@/types/content';

interface ContentCardProps {
  item: ContentListItem;
  progress?: number;
}

export default function ContentCard({ item, progress }: ContentCardProps) {
  return (
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
      {/* Always-visible bottom gradient with title */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-3">
        <p className="text-white text-[13px] font-semibold leading-tight line-clamp-2 drop-shadow-lg">{item.title}</p>
        {(item.year || item.rating) && (
          <p className="text-white/50 text-[11px] mt-1">
            {item.year ?? ''}{item.rating ? ` · ${item.rating}` : ''}
          </p>
        )}
      </div>
      {/* Hover highlight border */}
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
  );
}
