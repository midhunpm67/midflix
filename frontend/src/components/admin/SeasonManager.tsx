import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import EpisodeList from './EpisodeList';
import {
  adminCreateSeason,
  adminUpdateSeason,
  adminDeleteSeason,
} from '@/api/admin/content';
import { getContentSeasons, getSeasonEpisodes } from '@/api/content';

const seasonSchema = z.object({
  number: z.coerce.number().int().min(1, 'Required'),
  title: z.string().nullable().optional(),
});

type SeasonFormValues = z.infer<typeof seasonSchema>;

interface SeasonManagerProps {
  contentId: string;
  slug: string;
}

export default function SeasonManager({ contentId, slug }: SeasonManagerProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['admin-content-seasons', contentId],
    queryFn: () => getContentSeasons(slug),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-content-seasons', contentId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: SeasonFormValues) =>
      adminCreateSeason(contentId, { number: data.number, title: data.title ?? null }),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SeasonFormValues }) =>
      adminUpdateSeason(id, { number: data.number, title: data.title ?? null }),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSeason(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading seasons…</div>;

  return (
    <div>
      <h2 className="text-lg font-display tracking-widest uppercase text-white mb-4">Seasons</h2>

      <div className="space-y-2">
        {seasons.map((season) => (
          <div key={season.id} className="border border-border rounded overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-card">
              {editingId === season.id ? (
                <InlineSeasonForm
                  defaultValues={{ number: season.number, title: season.title ?? '' }}
                  onSubmit={(data) => updateMutation.mutate({ id: season.id, data })}
                  onCancel={() => setEditingId(null)}
                  isSubmitting={updateMutation.isPending}
                  error={updateMutation.isError ? ((updateMutation.error as Error)?.message ?? 'Something went wrong') : undefined}
                />
              ) : (
                <>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === season.id ? null : season.id)
                    }
                    className="flex-1 text-left text-white text-sm font-medium"
                  >
                    Season {season.number}
                    {season.title ? ` — ${season.title}` : ''}
                  </button>
                  <button
                    onClick={() => setEditingId(season.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (
                        !confirm(`Delete Season ${season.number} and all its episodes?`)
                      )
                        return;
                      deleteMutation.mutate(season.id);
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {expandedId === season.id && <EpisodesWrapper seasonId={season.id} />}
          </div>
        ))}

        {seasons.length === 0 && (
          <p className="text-sm text-muted-foreground">No seasons yet.</p>
        )}
      </div>

      {showAdd ? (
        <div className="mt-3 border border-border rounded p-3 bg-card">
          <InlineSeasonForm
            defaultValues={{ number: seasons.length + 1, title: '' }}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowAdd(false)}
            isSubmitting={createMutation.isPending}
            error={createMutation.isError ? ((createMutation.error as Error)?.message ?? 'Something went wrong') : undefined}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 text-sm text-primary hover:underline"
        >
          + Add season
        </button>
      )}
    </div>
  );
}

function EpisodesWrapper({ seasonId }: { seasonId: string }) {
  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['admin-season-episodes', seasonId],
    queryFn: () => getSeasonEpisodes(seasonId),
  });

  if (isLoading) return <div className="px-4 py-3 bg-background text-sm text-muted-foreground">Loading episodes…</div>;

  return (
    <div className="px-4 py-3 bg-background">
      <EpisodeList seasonId={seasonId} episodes={episodes} />
    </div>
  );
}

interface InlineSeasonFormProps {
  defaultValues: Partial<SeasonFormValues>;
  onSubmit: (data: SeasonFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

function InlineSeasonForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: InlineSeasonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { number: defaultValues.number ?? 1, title: defaultValues.title ?? '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 flex-1">
      <div>
        <input
          {...register('number')}
          type="number"
          placeholder="Season #"
          className="w-20 bg-background border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.number && (
          <p className="text-destructive text-xs">{errors.number.message}</p>
        )}
      </div>
      <div className="flex-1">
        <input
          {...register('title')}
          placeholder="Season title (optional)"
          className="w-full bg-background border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="text-xs bg-primary text-white px-2 py-1 rounded disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:text-white"
      >
        Cancel
      </button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </form>
  );
}
