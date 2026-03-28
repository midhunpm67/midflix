import { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { getMuxStreamUrl } from '@/lib/mux';

const CONTROLS_HIDE_DELAY_MS = 3000;

interface VideoPlayerProps {
  playbackId: string | null;
  posterUrl?: string | null;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: () => void;
  onPlay?: () => void;
  onEnded?: () => void;
  initialTime?: number;
  autoPlay?: boolean;
}

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export default function VideoPlayer({
  playbackId,
  posterUrl,
  onTimeUpdate,
  onPause,
  onPlay,
  onEnded,
  initialTime = 0,
  autoPlay = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const hasSetInitialTime = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [pipSupported, setPipSupported] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    setPipSupported(document.pictureInPictureEnabled ?? false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackId) return;

    hasSetInitialTime.current = false;
    const src = getMuxStreamUrl(playbackId);

    function onLoadedMetadata() {
      if (!hasSetInitialTime.current && initialTime > 0 && video) {
        video.currentTime = initialTime;
        hasSetInitialTime.current = true;
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackId, initialTime, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleTimeUpdate() {
      setCurrentTime(video!.currentTime);
      setDuration(video!.duration || 0);
      onTimeUpdate?.(video!.currentTime, video!.duration || 0);

      if (video!.buffered.length > 0) {
        setBuffered(video!.buffered.end(video!.buffered.length - 1));
      }
    }

    function handlePlay() {
      setIsPlaying(true);
      onPlay?.();
      resetHideTimer();
    }

    function handlePause() {
      setIsPlaying(false);
      setShowControls(true);
      onPause?.();
    }

    function handleEnded() {
      setIsPlaying(false);
      setShowControls(true);
      onEnded?.();
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onPlay, onPause, onEnded, resetHideTimer]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }

  function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      video.requestPictureInPicture();
    }
  }

  if (!playbackId) {
    return (
      <div className="relative w-full aspect-video bg-background flex items-center justify-center">
        <p className="text-muted text-lg">Video not available</p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black group"
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={posterUrl ?? undefined}
        playsInline
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 cursor-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom gradient */}
        <div className="bg-gradient-to-t from-black/80 to-transparent pt-16 pb-3 px-4">
          {/* Seek bar */}
          <div className="relative w-full h-1 group/seek mb-3">
            {/* Buffered track */}
            <div
              className="absolute inset-y-0 left-0 bg-white/30 rounded"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Progress track */}
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <span className="text-white text-xs tabular-nums select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-primary cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* PiP */}
            {pipSupported && (
              <button
                onClick={togglePip}
                className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label="Picture in Picture"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
                </svg>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-colors w-11 h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
