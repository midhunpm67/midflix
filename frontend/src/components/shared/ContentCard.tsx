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
      className="group relative aspect-[2/3] rounded-card overflow-hidden flex-shrink-0 bg-surface block focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {(item.poster_url || item.backdrop_url) ? (
        <img
          src={item.poster_url ?? item.backdrop_url!}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.08]"
        />
      ) : (
        <div className="w-full h-full bg-surface-variant flex items-center justify-center">
          <span className="text-muted text-xs text-center px-2">{item.title}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <p className="text-white text-sm font-medium leading-tight line-clamp-2">{item.title}</p>
        <p className="text-muted text-xs mt-1">
          {item.year ?? ''}{item.rating ? ` · ${item.rating}` : ''}
        </p>
      </div>
      {progress != null && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}
