import ContentCard from './ContentCard';
import type { ContentListItem } from '@/types/content';

interface ContentGridProps {
  items: ContentListItem[];
  isLoading: boolean;
}

export default function ContentGrid({ items, isLoading }: ContentGridProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-xl bg-surface animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
