import { Play, Loader2 } from 'lucide-react';
import { useRef, useEffect, ChangeEvent } from 'react';
import { useCustomPlayer } from '../hooks/useCustomPlayer';
import type { VOD, PlayerState, PlayerSettings, PlayerSource, Chapter } from '../types';
import PlayerControls from './PlayerControls';

const setVideoCurrentTime = (video: HTMLVideoElement, time: number) => {
  video.currentTime = time;
};

export interface PlayerProps {
  setCurrentTime: (_time: number) => void;
  type?: string;
  vod: VOD;
  timestamp?: number;
  setDelay?: (_delay: number) => void;
  setPlayerState: (_state: PlayerState) => void;
  cdnBase?: string;
  defaultVolume: number;
  defaultMuted: boolean;
  theatreMode: boolean;
  setTheatreMode: (_v: boolean) => void;
  copyTimestamp: () => void;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  onUpdateSettings?: (_settings: PlayerSettings) => void;
  chapters?: Chapter[];
  currentChapter?: Chapter | null;
}

export default function Player(props: PlayerProps) {
  const {
    setCurrentTime,
    type,
    vod,
    timestamp,
    setDelay,
    setPlayerState,
    cdnBase,
    defaultVolume,
    defaultMuted,
    theatreMode,
    setTheatreMode,
    copyTimestamp,
    playerRef,
    onUpdateSettings,
    chapters,
    currentChapter,
  } = props;

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const originalSourceRef = useRef<PlayerSource>(undefined);

  const {
    source,
    fileError,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isFullscreen,
    playbackSpeed,
    isBuffering,
    toggleFullscreen,
    togglePiP,
    togglePlayPause,
    toggleMute,
    handleVolumeChange,
    handleSeekChange,
    handlePlaybackSpeedChange,
    handleError,
    timeUpdate,
    handlePlay,
    handlePause,
    handleEnded,
    handleWaiting,
    handlePlaying,
    handleLoadedMetadata,
    setSource,
  } = useCustomPlayer({
    type,
    vod,
    cdnBase,
    playerRef,
    setDelay,
    setPlayerState,
    defaultVolume,
    defaultMuted,
    onUpdateSettings,
  });

  useEffect(() => {
    if (!playerRef.current || timestamp === undefined || !source) return;
    setVideoCurrentTime(playerRef.current, timestamp);
  }, [timestamp, source, playerRef]);

  useEffect(() => {
    setCurrentTime(currentTime);
  }, [setCurrentTime, currentTime]);

  const fileChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files![0];
    if (!file || !file.type.match(/video\//)) {
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);
  };

  const toggleTheatreMode = () => {
    setTheatreMode(!theatreMode);
  };

  return (
    <div className="h-full w-full">
      <div ref={playerContainerRef} className="relative h-full w-full overflow-hidden outline-none">
        {type === 'manual' && !source && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#16161e]">
            {fileError && (
              <div className="mb-2 rounded-lg border border-red-700 bg-red-900/50 px-4 py-2 text-sm text-red-200">
                {fileError}
              </div>
            )}
            <div className="mt-4">
              <label className="inline-block cursor-pointer rounded-lg bg-white px-4 py-2 text-[#16161e] transition-colors hover:bg-[#e5e7eb]">
                Select Video
                <input type="file" hidden onChange={fileChange} accept="video/*,.mkv" />
              </label>
            </div>
          </div>
        )}

        <video
          ref={playerRef}
          playsInline
          autoPlay
          tabIndex={-1}
          poster={vod.vod_uploads[0]?.thumbnail_url || undefined}
          preload="auto"
          onTimeUpdate={timeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onError={handleError}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlayPause}
          onDoubleClick={toggleFullscreen}
          className="h-full w-full cursor-pointer"
          style={{ visibility: !source ? ('hidden' as const) : 'visible' }}
        />

        {source && (
          <>
            <div
              onClick={togglePlayPause}
              onDoubleClick={toggleFullscreen}
              className={`absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 transition-opacity duration-200 ${
                isPlaying ? 'pointer-events-none opacity-0 delay-75' : 'opacity-100 delay-75'
              }`}
            >
              <Play className="h-[15%] max-h-[72px] min-h-[32px] w-[15%] max-w-[72px] min-w-[32px] translate-x-1 text-white drop-shadow-2xl" />
            </div>

            {isBuffering && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-white/80" />
              </div>
            )}

            {fileError && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
                <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-200">
                  {fileError}
                </div>
                <button
                  onClick={() => {
                    originalSourceRef.current = source;
                    setSource(undefined);
                    setTimeout(() => setSource(originalSourceRef.current), 100);
                  }}
                  className="rounded-lg bg-white px-4 py-2 text-[#16161e] transition-colors hover:bg-[#e5e7eb]"
                >
                  Retry
                </button>
              </div>
            )}

            <PlayerControls
              isPlaying={isPlaying}
              volume={volume}
              isMuted={isMuted}
              currentTime={currentTime}
              duration={duration}
              theatreMode={theatreMode}
              isFullscreen={isFullscreen}
              playbackSpeed={playbackSpeed}
              onTogglePlayPause={togglePlayPause}
              onVolumeChange={handleVolumeChange}
              onSeekChange={handleSeekChange}
              onToggleMute={toggleMute}
              onToggleTheatreMode={toggleTheatreMode}
              onToggleFullscreen={toggleFullscreen}
              onTogglePiP={togglePiP}
              playerContainerRef={playerContainerRef}
              onPlaybackSpeedChange={handlePlaybackSpeedChange}
              onCopyTimestamp={copyTimestamp}
              chapters={chapters}
              currentChapter={currentChapter}
            />
          </>
        )}
      </div>
    </div>
  );
}
