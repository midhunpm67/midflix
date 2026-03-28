import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  adminCreateEpisode,
  adminUpdateEpisode,
  adminDeleteEpisode,
} from '@/api/admin/content';
import type { Episode } from '@/types/content';
import { getMuxThumbnailUrl } from '@/lib/mux';

const episodeSchema = z.object({
  number: z.coerce.number().int().min(1, 'Required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1).nullable().optional()
  ),
  playback_id: z.string().nullable().optional(),
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

interface EpisodeListProps {
  seasonId: string;
  episodes: Episode[];
}

export default function EpisodeList({ seasonId, episodes }: EpisodeListProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-season-episodes', seasonId] });

  const createMutation = useMutation({
    mutationFn: (data: EpisodeFormValues) =>
      adminCreateEpisode(seasonId, {
        number: data.number,
        title: data.title,
        description: data.description ?? null,
        duration: data.duration ?? null,
        video: { playback_id: data.playback_id || null },
      }),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      toast.success('Episode created');
    },
    onError: () => toast.error('Failed to create episode'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EpisodeFormValues }) =>
      adminUpdateEpisode(id, {
        number: data.number,
        title: data.title,
        description: data.description ?? null,
        duration: data.duration ?? null,
        video: { playback_id: data.playback_id || null },
      }),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success('Episode updated');
    },
    onError: () => toast.error('Failed to update episode'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteEpisode(id),
    onSuccess: () => {
      invalidate();
      toast.success('Episode deleted');
    },
    onError: () => toast.error('Failed to delete episode'),
  });

  return (
    <div className="mt-3 space-y-2 pl-4 border-l border-border">
      {episodes.map((ep) => (
        <div key={ep.id}>
          {editingId === ep.id ? (
            <InlineEpisodeForm
              defaultValues={{
                number: ep.number,
                title: ep.title,
                description: ep.description,
                duration: ep.duration,
                playback_id: ep.video?.playback_id,
              }}
              onSubmit={(data) => updateMutation.mutate({ id: ep.id, data })}
              onCancel={() => setEditingId(null)}
              isSubmitting={updateMutation.isPending}
              error={updateMutation.isError ? ((updateMutation.error as Error)?.message ?? 'Something went wrong') : undefined}
            />
          ) : (
            <div className="flex items-center gap-3 text-sm py-1">
              <span className="text-muted-foreground w-6 text-right">{ep.number}.</span>
              {ep.video?.playback_id && (
                <img
                  src={getMuxThumbnailUrl(ep.video.playback_id)}
                  alt=""
                  className="w-12 h-7 rounded object-cover border border-border"
                />
              )}
              <span className="text-white flex-1">{ep.title}</span>
              {ep.duration != null && (
                <span className="text-muted-foreground text-xs">{ep.duration}m</span>
              )}
              <button
                onClick={() => setEditingId(ep.id)}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Delete "${ep.title}"?`)) return;
                  deleteMutation.mutate(ep.id);
                }}
                className="text-xs text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <InlineEpisodeForm
          defaultValues={{ number: episodes.length + 1, title: '' }}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowAdd(false)}
          isSubmitting={createMutation.isPending}
          error={createMutation.isError ? ((createMutation.error as Error)?.message ?? 'Something went wrong') : undefined}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs text-primary hover:underline mt-1"
        >
          + Add episode
        </button>
      )}
    </div>
  );
}

interface InlineEpisodeFormProps {
  defaultValues: Partial<EpisodeFormValues>;
  onSubmit: (data: EpisodeFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

function InlineEpisodeForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: InlineEpisodeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      number: defaultValues.number ?? 1,
      title: defaultValues.title ?? '',
      description: defaultValues.description ?? '',
      duration: defaultValues.duration ?? undefined,
      playback_id: defaultValues.playback_id ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2 py-1">
      <div>
        <input
          {...register('number')}
          type="number"
          placeholder="#"
          className="w-12 bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.number && <p className="text-destructive text-xs">{errors.number.message}</p>}
      </div>
      <div className="flex-1">
        <input
          {...register('title')}
          placeholder="Episode title"
          className="w-full bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.title && (
          <p className="text-destructive text-xs">{errors.title.message}</p>
        )}
      </div>
      <input
        {...register('duration')}
        type="number"
        placeholder="min"
        className="w-16 bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        {...register('playback_id')}
        placeholder="Mux ID"
        className="w-24 bg-card border border-border text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
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
        className="text-xs text-muted-foreground hover:text-white px-1"
      >
        Cancel
      </button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </form>
  );
}
