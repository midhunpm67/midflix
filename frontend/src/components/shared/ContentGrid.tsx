import ContentCard from './ContentCard';
import type { ContentListItem } from '@/types/content';

interface ContentGridProps {
  items: ContentListItem[];
  isLoading: boolean;
}

export default function ContentGrid({ items, isLoading }: ContentGridProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-card bg-surface animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
