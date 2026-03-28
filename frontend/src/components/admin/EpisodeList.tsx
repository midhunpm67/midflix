import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminCreateEpisode,
  adminUpdateEpisode,
  adminDeleteEpisode,
} from '@/api/admin/content';
import type { Episode } from '@/types/content';

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
    mutationFn: (data: EpisodeFormData) =>
      adminCreateEpisode(seasonId, {
        number: data.number,
        title: data.title,
        description: null,
        duration: data.duration || null,
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
    mutationFn: ({ id, data }: { id: string; data: EpisodeFormData }) =>
      adminUpdateEpisode(id, {
        number: data.number,
        title: data.title,
        description: null,
        duration: data.duration || null,
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
    <div className="flex flex-col gap-2">
      {/* Column headers */}
      <div className="grid grid-cols-[50px_1fr_1fr_1fr_36px] gap-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-white/30">
        <span className="text-center">#</span>
        <span>Episode Title</span>
        <span>Mux Playback ID</span>
        <span>Duration (mins)</span>
        <span />
      </div>

      {/* Episode rows */}
      {episodes.map((ep) => (
        <div key={ep.id}>
          {editingId === ep.id ? (
            <EpisodeRow
              defaultValues={{
                number: ep.number,
                title: ep.title,
                playback_id: ep.video?.playback_id ?? '',
                duration: ep.duration ?? null,
              }}
              onSubmit={(data) => updateMutation.mutate({ id: ep.id, data })}
              onCancel={() => setEditingId(null)}
              isSubmitting={updateMutation.isPending}
              onDelete={() => {
                if (!confirm(`Delete "${ep.title}"?`)) return;
                deleteMutation.mutate(ep.id);
              }}
            />
          ) : (
            <div className="grid grid-cols-[50px_1fr_1fr_1fr_36px] gap-3 items-center bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl px-4 py-3">
              <span className="text-center text-xs font-semibold text-primary">
                E{String(ep.number).padStart(2, '0')}
              </span>
              <span className="text-sm text-white/80 truncate">{ep.title}</span>
              <span className="text-xs text-white/30 font-mono truncate">
                {ep.video?.playback_id || '—'}
              </span>
              <span className="text-xs text-white/40">
                {ep.duration != null ? `${ep.duration} mins` : '—'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingId(ep.id)}
                  className="text-[10px] text-white/30 hover:text-primary transition-colors"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Delete "${ep.title}"?`)) return;
                    deleteMutation.mutate(ep.id);
                  }}
                  className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add episode row */}
      {showAdd ? (
        <EpisodeRow
          defaultValues={{
            number: episodes.length + 1,
            title: '',
            playback_id: '',
            duration: null,
          }}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowAdd(false)}
          isSubmitting={createMutation.isPending}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-xl border border-dashed border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors"
        >
          + Add Episode
        </button>
      )}
    </div>
  );
}

interface EpisodeFormData {
  number: number;
  title: string;
  playback_id: string;
  duration: number | null;
}

interface EpisodeRowProps {
  defaultValues: EpisodeFormData;
  onSubmit: (data: EpisodeFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  onDelete?: () => void;
}

function EpisodeRow({ defaultValues, onSubmit, onCancel, isSubmitting, onDelete }: EpisodeRowProps) {
  const [number] = useState(defaultValues.number);
  const [title, setTitle] = useState(defaultValues.title);
  const [playbackId, setPlaybackId] = useState(defaultValues.playback_id);
  const [duration, setDuration] = useState(defaultValues.duration?.toString() ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      number,
      title: title.trim(),
      playback_id: playbackId.trim(),
      duration: duration ? parseInt(duration) : null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-[50px_1fr_1fr_1fr_36px] gap-3 items-center bg-[#0d0d0d] border border-primary/20 rounded-xl px-4 py-3"
    >
      <span className="text-center text-xs font-semibold text-primary">
        E{String(number).padStart(2, '0')}
      </span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Episode title"
        className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/50 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors"
      />
      <input
        value={playbackId}
        onChange={(e) => setPlaybackId(e.target.value)}
        placeholder="Mux Playback ID"
        className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/50 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors"
      />
      <input
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        type="number"
        placeholder="Duration (mins)"
        className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/50 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors"
      />
      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="text-[10px] text-primary hover:text-primary/80 disabled:opacity-30 transition-colors"
          title="Save"
        >
          ✓
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
            title="Delete"
          >
            ×
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            title="Cancel"
          >
            ×
          </button>
        )}
      </div>
    </form>
  );
}
