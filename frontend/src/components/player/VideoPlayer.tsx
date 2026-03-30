import { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { getMuxStreamUrl } from '@/lib/mux';

const CONTROLS_HIDE_DELAY_MS = 3000;
const SKIP_SECONDS = 10;

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

interface QualityLevel {
  index: number;
  height: number;
  label: string;
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

  // Quality
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Subtitles
  const [subtitleTracks, setSubtitleTracks] = useState<TextTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState(-1); // -1 = Off
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // Skip indicator
  const [skipIndicator, setSkipIndicator] = useState<string | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowQualityMenu(false);
        setShowSubtitleMenu(false);
      }
    }, CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    setPipSupported(document.pictureInPictureEnabled ?? false);
  }, []);

  // HLS setup
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
      // Collect subtitle tracks
      const tracks: TextTrack[] = [];
      for (let i = 0; i < (video?.textTracks.length ?? 0); i++) {
        tracks.push(video!.textTracks[i]);
      }
      setSubtitleTracks(tracks);
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Build quality levels
        const levels: QualityLevel[] = data.levels.map((level, index) => ({
          index,
          height: level.height,
          label: `${level.height}p`,
        }));
        setQualities(levels);
        setCurrentQuality(-1);
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

  // Video events
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
    function handlePlay() { setIsPlaying(true); onPlay?.(); resetHideTimer(); }
    function handlePause() { setIsPlaying(false); setShowControls(true); onPause?.(); }
    function handleEnded() { setIsPlaying(false); setShowControls(true); onEnded?.(); }

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

  // Fullscreen
  useEffect(() => {
    function handleFullscreenChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); skip(-SKIP_SECONDS); break;
        case 'ArrowRight': e.preventDefault(); skip(SKIP_SECONDS); break;
        case 'ArrowUp': e.preventDefault(); changeVolume(0.1); break;
        case 'ArrowDown': e.preventDefault(); changeVolume(-0.1); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  }

  function skip(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    setCurrentTime(video.currentTime);
    showSkipIndicator(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    resetHideTimer();
  }

  function showSkipIndicator(text: string) {
    setSkipIndicator(text);
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    skipTimerRef.current = setTimeout(() => setSkipIndicator(null), 800);
  }

  function changeVolume(delta: number) {
    const video = videoRef.current;
    if (!video) return;
    const vol = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
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
    document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen();
  }

  function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    document.pictureInPictureElement ? document.exitPictureInPicture() : video.requestPictureInPicture();
  }

  function setQuality(levelIndex: number) {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  }

  function setSubtitle(trackIndex: number) {
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = i === trackIndex ? 'showing' : 'hidden';
    }
    setActiveSubtitle(trackIndex);
    setShowSubtitleMenu(false);
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
  const qualityLabel = currentQuality === -1 ? 'Auto' : qualities.find(q => q.index === currentQuality)?.label ?? 'Auto';

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
        crossOrigin="anonymous"
      />

      {/* Skip indicator */}
      {skipIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/70 backdrop-blur-sm text-white text-lg font-bold px-5 py-2.5 rounded-xl animate-pulse">
            {skipIndicator}
          </div>
        </div>
      )}

      {/* Center play button (when paused) */}
      {!isPlaying && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      )}

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
          <div className="relative w-full h-1 group/seek mb-3 hover:h-1.5 transition-all">
            <div className="absolute inset-y-0 left-0 bg-white/30 rounded" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute inset-y-0 left-0 bg-primary rounded" style={{ width: `${progressPercent}%` }} />
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
          <div className="flex items-center gap-1 md:gap-2">
            {/* Play/Pause */}
            <ControlButton onClick={togglePlay} label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </ControlButton>

            {/* Rewind 10s */}
            <ControlButton onClick={() => skip(-SKIP_SECONDS)} label="Rewind 10 seconds">
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">10</span>
              </div>
            </ControlButton>

            {/* Forward 10s */}
            <ControlButton onClick={() => skip(SKIP_SECONDS)} label="Forward 10 seconds">
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">10</span>
              </div>
            </ControlButton>

            {/* Time */}
            <span className="text-white text-xs tabular-nums select-none ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Subtitles */}
            <div className="relative">
              <ControlButton
                onClick={() => { setShowSubtitleMenu(!showSubtitleMenu); setShowQualityMenu(false); }}
                label="Subtitles"
                active={activeSubtitle >= 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z"/></svg>
              </ControlButton>
              {showSubtitleMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#141420] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                  <div className="px-3 py-2 border-b border-white/[0.06]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Subtitles</span>
                  </div>
                  <button
                    onClick={() => setSubtitle(-1)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${activeSubtitle === -1 ? 'text-primary bg-primary/10' : 'text-white/60 hover:bg-white/[0.06]'}`}
                  >
                    Off
                  </button>
                  {subtitleTracks.map((track, i) => (
                    <button
                      key={i}
                      onClick={() => setSubtitle(i)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${activeSubtitle === i ? 'text-primary bg-primary/10' : 'text-white/60 hover:bg-white/[0.06]'}`}
                    >
                      {track.label || track.language || `Track ${i + 1}`}
                    </button>
                  ))}
                  {subtitleTracks.length === 0 && (
                    <div className="px-3 py-2 text-white/30 text-xs">No subtitles available</div>
                  )}
                </div>
              )}
            </div>

            {/* Quality */}
            {qualities.length > 1 && (
              <div className="relative">
                <ControlButton
                  onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSubtitleMenu(false); }}
                  label="Quality"
                >
                  <div className="flex items-center gap-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                    <span className="text-[10px] font-medium hidden sm:inline">{qualityLabel}</span>
                  </div>
                </ControlButton>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#141420] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Quality</span>
                    </div>
                    <button
                      onClick={() => setQuality(-1)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${currentQuality === -1 ? 'text-primary bg-primary/10' : 'text-white/60 hover:bg-white/[0.06]'}`}
                    >
                      Auto
                    </button>
                    {[...qualities].sort((a, b) => b.height - a.height).map((q) => (
                      <button
                        key={q.index}
                        onClick={() => setQuality(q.index)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${currentQuality === q.index ? 'text-primary bg-primary/10' : 'text-white/60 hover:bg-white/[0.06]'}`}
                      >
                        {q.label}
                        {q.height >= 1080 && <span className="ml-1.5 text-[9px] font-bold text-primary/70">HD</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Volume (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1">
              <ControlButton onClick={toggleMute} label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted || volume === 0 ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                )}
              </ControlButton>
              <input
                type="range" min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 accent-primary cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* PiP */}
            {pipSupported && (
              <ControlButton onClick={togglePip} label="Picture in Picture">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" /></svg>
              </ControlButton>
            )}

            {/* Fullscreen */}
            <ControlButton onClick={toggleFullscreen} label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
              )}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ onClick, label, children, active }: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`hover:text-primary transition-colors w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
        active ? 'text-primary' : 'text-white'
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}
