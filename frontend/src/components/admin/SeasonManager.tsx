import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import EpisodeList from './EpisodeList';
import {
  adminCreateSeason,
  adminDeleteSeason,
  adminGetContentSeasons,
  adminGetSeasonEpisodes,
} from '@/api/admin/content';

interface SeasonManagerProps {
  contentId: string;
}

export default function SeasonManager({ contentId }: SeasonManagerProps) {
  const queryClient = useQueryClient();
  const [addingEpisodeFor, setAddingEpisodeFor] = useState<string | null>(null);

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['admin-content-seasons', contentId],
    queryFn: () => adminGetContentSeasons(contentId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-content-seasons', contentId] });
  };

  const createMutation = useMutation({
    mutationFn: () => adminCreateSeason(contentId, { number: seasons.length + 1, title: null }),
    onSuccess: () => {
      invalidate();
      toast.success('Season created');
    },
    onError: () => toast.error('Failed to create season'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSeason(id),
    onSuccess: () => {
      invalidate();
      toast.success('Season deleted');
    },
    onError: () => toast.error('Failed to delete season'),
  });

  if (isLoading) return <div className="text-white/30 text-sm">Loading seasons...</div>;

  return (
    <div className="flex flex-col gap-8">
      {seasons.map((season) => (
        <div key={season.id}>
          {/* Season header with Add Episode on right */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
                Season {season.number}
                {season.title ? ` — ${season.title}` : ''}
              </span>
              <button
                onClick={() => {
                  if (!confirm(`Delete Season ${season.number} and all its episodes?`)) return;
                  deleteMutation.mutate(season.id);
                }}
                className="text-[10px] text-white/20 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAddingEpisodeFor(season.id)}
              className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-[11px] font-semibold hover:bg-primary/10 transition-colors"
            >
              + Add Episode
            </button>
          </div>

          {/* Episodes */}
          <EpisodesWrapper
            seasonId={season.id}
            showAdd={addingEpisodeFor === season.id}
            onAddDone={() => setAddingEpisodeFor(null)}
          />
        </div>
      ))}

      {seasons.length === 0 && (
        <p className="text-white/30 text-sm">No seasons yet. Add your first season to get started.</p>
      )}

      {/* Add Season */}
      <button
        type="button"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className="py-3 rounded-xl border border-dashed border-[#2a2a2a] hover:border-primary/30 text-white/30 hover:text-white/50 text-sm transition-colors disabled:opacity-50"
      >
        + Add Season
      </button>
    </div>
  );
}

function EpisodesWrapper({
  seasonId,
  showAdd,
  onAddDone,
}: {
  seasonId: string;
  showAdd: boolean;
  onAddDone: () => void;
}) {
  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['admin-season-episodes', seasonId],
    queryFn: () => adminGetSeasonEpisodes(seasonId),
  });

  if (isLoading) return <div className="text-white/20 text-sm py-3">Loading episodes...</div>;

  return (
    <EpisodeList
      seasonId={seasonId}
      episodes={episodes}
      showAdd={showAdd}
      onAddDone={onAddDone}
    />
  );
}
