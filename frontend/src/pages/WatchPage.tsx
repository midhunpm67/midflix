import { useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getContentBySlug, getContentSeasons, getSeasonEpisodes } from '@/api/content';
import { saveWatchHistory, getWatchHistory } from '@/api/watch-history';
import { useAuthStore } from '@/stores/authStore';
import VideoPlayer from '@/components/player/VideoPlayer';
import type { Episode, Season } from '@/types/content';

const SAVE_INTERVAL_MS = 15000;

export default function WatchPage() {
  const { slug, episodeId } = useParams<{ slug: string; episodeId?: string }>();
  const navigate = useNavigate();
  const progressRef = useRef({ currentTime: 0, duration: 0 });
  const lastSaveRef = useRef(0);

  const { data: content, isLoading: loadingContent } = useQuery({
    queryKey: ['content', slug],
    queryFn: () => getContentBySlug(slug!),
    enabled: !!slug,
  });

  const isSeriesMode = content?.type === 'series' && !!episodeId;

  const { data: seasons = [] } = useQuery({
    queryKey: ['content-seasons', slug],
    queryFn: () => getContentSeasons(slug!),
    enabled: !!slug && isSeriesMode,
  });

  const currentSeason = findSeasonForEpisode(seasons, episodeId);

  const { data: episodes = [] } = useQuery({
    queryKey: ['season-episodes', currentSeason?.id],
    queryFn: () => getSeasonEpisodes(currentSeason!.id),
    enabled: !!currentSeason,
  });

  const currentEpisode = episodes.find((ep) => ep.id === episodeId);

  const { isAuthenticated } = useAuthStore();
  const contentId = content?.id ?? '';
  const watchEpisodeId = isSeriesMode ? (episodeId ?? null) : null;

  const { data: watchHistory } = useQuery({
    queryKey: ['watch-history', contentId, watchEpisodeId],
    queryFn: () => getWatchHistory(contentId, watchEpisodeId),
    enabled: !!contentId && isAuthenticated,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: saveWatchHistory,
  });

  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;

  const saveProgress = useCallback(() => {
    if (!isAuthenticated || !contentId || progressRef.current.duration === 0) return;
    const now = Date.now();
    if (now - lastSaveRef.current < SAVE_INTERVAL_MS) return;
    lastSaveRef.current = now;
    saveMutateRef.current({
      content_id: contentId,
      episode_id: watchEpisodeId,
      progress_seconds: Math.floor(progressRef.current.currentTime),
      duration_seconds: Math.floor(progressRef.current.duration),
    });
  }, [contentId, watchEpisodeId]);

  const saveProgressForce = useCallback(() => {
    if (!isAuthenticated || !contentId || progressRef.current.duration === 0) return;
    lastSaveRef.current = Date.now();
    saveMutateRef.current({
      content_id: contentId,
      episode_id: watchEpisodeId,
      progress_seconds: Math.floor(progressRef.current.currentTime),
      duration_seconds: Math.floor(progressRef.current.duration),
    });
  }, [contentId, watchEpisodeId]);

  useEffect(() => {
    function handleBeforeUnload() {
      const token = localStorage.getItem('auth_token');
      if (!token || !contentId || progressRef.current.duration === 0) return;
      const payload = JSON.stringify({
        content_id: contentId,
        episode_id: watchEpisodeId,
        progress_seconds: Math.floor(progressRef.current.currentTime),
        duration_seconds: Math.floor(progressRef.current.duration),
      });
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
      fetch(`${apiBase}/api/v1/me/watch-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
        keepalive: true,
      });
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contentId, watchEpisodeId]);

  function handleTimeUpdate(currentTime: number, duration: number) {
    progressRef.current = { currentTime, duration };
    saveProgress();
  }

  function handlePause() {
    saveProgressForce();
  }

  function handleEnded() {
    if (!contentId || progressRef.current.duration === 0) return;
    saveMutation.mutate({
      content_id: contentId,
      episode_id: watchEpisodeId,
      progress_seconds: Math.floor(progressRef.current.duration),
      duration_seconds: Math.floor(progressRef.current.duration),
    });

    if (isSeriesMode && currentEpisode) {
      const nextEpisode = episodes.find((ep) => ep.number === currentEpisode.number + 1);
      if (nextEpisode) {
        navigate(`/watch/${slug}/episode/${nextEpisode.id}`);
      }
    }
  }

  const playbackId = isSeriesMode
    ? (currentEpisode?.video?.playback_id ?? null)
    : (content?.video?.playback_id ?? null);

  const posterUrl = isSeriesMode
    ? (currentEpisode?.thumbnail_url ?? content?.backdrop_url ?? null)
    : (content?.backdrop_url ?? null);

  const displayTitle =
    isSeriesMode && currentEpisode && currentSeason
      ? `S${currentSeason.number}:E${currentEpisode.number} — ${currentEpisode.title}`
      : (content?.title ?? '');

  if (loadingContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-lg">Content not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Player area */}
      <div className="relative">
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4 flex items-center gap-3">
          <Link
            to={`/content/${content.slug}`}
            className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Back to content page"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <span className="text-white text-sm font-medium truncate">{displayTitle}</span>
        </div>

        <VideoPlayer
          playbackId={playbackId}
          posterUrl={posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          initialTime={watchHistory?.progress_seconds ?? 0}
          autoPlay
        />
      </div>

      {/* Episode list (series only) */}
      {isSeriesMode && episodes.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-white text-lg font-semibold mb-4">
            Season {currentSeason?.number} Episodes
          </h2>
          <div className="space-y-1">
            {episodes.map((ep) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                isActive={ep.id === episodeId}
                slug={slug!}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EpisodeRowProps {
  episode: Episode;
  isActive: boolean;
  slug: string;
}

function EpisodeRow({ episode, isActive, slug }: EpisodeRowProps) {
  return (
    <Link
      to={`/watch/${slug}/episode/${episode.id}`}
      className={`flex items-center gap-4 px-4 py-3 rounded transition-colors text-sm ${
        isActive
          ? 'bg-primary/10 border-l-2 border-primary'
          : 'hover:bg-surface-variant/30'
      } focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
    >
      <span className="text-muted w-6 text-right flex-shrink-0">{episode.number}</span>
      <span className={`flex-1 ${isActive ? 'text-primary font-medium' : 'text-white'}`}>
        {episode.title}
      </span>
      {episode.duration != null && (
        <span className="text-muted text-xs">{episode.duration}m</span>
      )}
    </Link>
  );
}

/**
 * Returns the season containing the given episode. Currently defaults to the
 * first season — sufficient because the Play button links to S1E1 and the
 * episode list only shows same-season episodes. Multi-season navigation will
 * require passing season_id through the URL in a future phase.
 */
function findSeasonForEpisode(seasons: Season[], _episodeId: string | undefined): Season | undefined {
  return seasons[0];
}
