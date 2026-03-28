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
  showAdd: boolean;
  onAddDone: () => void;
}

export default function EpisodeList({ seasonId, episodes, showAdd, onAddDone }: EpisodeListProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

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
      onAddDone();
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
      {(episodes.length > 0 || showAdd) && (
        <div className="grid grid-cols-[50px_1fr_1fr_1fr_36px] gap-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-white/30">
          <span className="text-center">#</span>
          <span>Episode Title</span>
          <span>Mux Playback ID</span>
          <span>Duration (mins)</span>
          <span />
        </div>
      )}

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
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => setEditingId(ep.id)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Delete "${ep.title}"?`)) return;
                    deleteMutation.mutate(ep.id);
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add episode row (triggered from parent) */}
      {showAdd && (
        <EpisodeRow
          defaultValues={{
            number: episodes.length + 1,
            title: '',
            playback_id: '',
            duration: null,
          }}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={onAddDone}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Empty state */}
      {episodes.length === 0 && !showAdd && (
        <p className="text-white/20 text-xs py-2">No episodes yet. Click "+ Add Episode" above to add one.</p>
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
        autoFocus
        className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/50 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-white/20"
      />
      <input
        value={playbackId}
        onChange={(e) => setPlaybackId(e.target.value)}
        placeholder="Mux Playback ID"
        className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/50 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-white/20"
      />
      <input
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        type="number"
        placeholder="Duration (mins)"
        className="w-full bg-[#111] border border-[#1f1f1f] focus:border-primary/50 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-white/20"
      />
      <div className="flex flex-col gap-0.5 items-center">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="w-7 h-7 rounded-md flex items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
          title="Save"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </button>
        <button
          type="button"
          onClick={onDelete ?? onCancel}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            onDelete ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
          }`}
          title={onDelete ? 'Delete' : 'Cancel'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </form>
  );
}
