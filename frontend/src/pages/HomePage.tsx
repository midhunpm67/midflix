import { useQuery } from '@tanstack/react-query';
import HeroBanner from '@/components/shared/HeroBanner';
import CarouselRow from '@/components/shared/CarouselRow';
import { getTrending, getNewReleases } from '@/api/content';

export default function HomePage() {
  const { data: newReleases = [], isLoading: loadingNew } = useQuery({
    queryKey: ['new-releases'],
    queryFn: getNewReleases,
  });

  const { data: trending = [], isLoading: loadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
  });

  const heroContent = newReleases.length > 0 ? newReleases[0] : null;

  return (
    <div className="-mt-16">
      <HeroBanner content={heroContent} isLoading={loadingNew} />
      <div className="relative z-10 -mt-16 space-y-2">
        <CarouselRow
          title="Trending Now"
          items={trending}
          isLoading={loadingTrending}
        />
        <CarouselRow
          title="New Releases"
          items={newReleases.slice(1)}
          isLoading={loadingNew}
        />
      </div>
    </div>
  );
}
