import canAutoplay from 'can-autoplay';
import type Hls from 'hls.js';
import type { ErrorData } from 'hls.js';
import { Play } from 'lucide-react';
import { useRef, useEffect, useState, useCallback, ChangeEvent } from 'react';
import type { VOD, PlayerSource, PlayerState, PlayerSettings } from '../types';
import { sleep } from '../utils/helpers';
import { loadPlayerSettings, savePlayerSettings } from '../utils/playerSettings';
import PlayerControls from './PlayerControls';

interface HlsConfig {
  enableWorker: boolean;
  lowLatencyMode: boolean;
  backBufferLength: number;
  maxBufferLength: number;
  maxMaxBufferLength: number;
  maxBufferSize: number;
  maxBufferHole: number;
  liveSyncDurationCount: number;
  liveDurationInfinity: boolean;
  debug: boolean;
}

const hlsConfig: HlsConfig = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  liveSyncDurationCount: 3,
  liveDurationInfinity: false,
  debug: false,
};

export interface PlayerProps {
  setCurrentTime: (time: number) => void;
  type?: string;
  vod: VOD;
  timestamp?: number;
  setDelay?: (delay: number) => void;
  setPlayerState: (state: PlayerState) => void;
  cdnBase?: string;
  defaultVolume: number;
  defaultMuted: boolean;
  theatreMode: boolean;
  setTheatreMode: (v: boolean) => void;
  copyTimestamp: () => void;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  onUpdateSettings?: (settings: PlayerSettings) => void;
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
  } = props;
  const hlsInstance = useRef<Hls | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [source, setSource] = useState<PlayerSource>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume || 100);
  const [isMuted, setIsMuted] = useState(defaultMuted || false);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    const settings = loadPlayerSettings();
    if (settings) {
      setVolume(settings.volume ?? 100);
      setIsMuted(settings.muted ?? false);
      if (playerRef.current) {
        playerRef.current.volume = (settings.volume ?? 100) / 100;
        playerRef.current.muted = settings.muted ?? false;
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initHls = async () => {
      if (type === 'cdn') {
        const hlsUrl = `${cdnBase}/videos/${vod.platform_vod_id}/hls/${vod.platform_vod_id}.m3u8`;
        setSource(hlsUrl);

        if (playerRef.current!.canPlayType('application/vnd.apple.mpegurl')) {
          playerRef.current!.src = hlsUrl;
          return;
        }

        const HlsClass = (await import('hls.js')).default;

        if (!isMounted) return;

        if (HlsClass.isSupported()) {
          hlsInstance.current = new HlsClass(hlsConfig);
          hlsInstance.current.loadSource(hlsUrl);
          hlsInstance.current.attachMedia(playerRef.current!);

          hlsInstance.current.on(HlsClass.Events.ERROR, (_event: unknown, _data: unknown) => {
            const data = _data as ErrorData;
            if (data.fatal) {
              switch (data.type) {
                case HlsClass.ErrorTypes.NETWORK_ERROR:
                case HlsClass.ErrorTypes.MEDIA_ERROR:
                  hlsInstance.current!.destroy();
                  break;
                default:
                  hlsInstance.current!.destroy();
                  setFileError('Failed to load video');
                  break;
              }
            }
          });
        }
      }
    };

    initHls();

    return () => {
      isMounted = false;
      if (hlsInstance.current) {
        hlsInstance.current.destroy();
      }
    };
  }, [type, cdnBase, vod, playerRef]);

  const timeUpdate = useCallback(() => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.currentTime ?? 0;
    setCurrentTimeState(currentTime);
    setCurrentTime(currentTime);
  }, [playerRef, setCurrentTime]);

  const fileChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setFileError(undefined);
    const file = evt.target.files![0];

    if (!file || !file.type.match(/video\//)) {
      return setFileError('Please select a valid video file');
    }

    if (source && typeof source === 'object' && source.objectUrl) {
      URL.revokeObjectURL(source.objectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSource({ src: objectUrl, type: file.type, objectUrl });
  };

  useEffect(() => {
    return () => {
      if (source && typeof source === 'object' && source.objectUrl) {
        URL.revokeObjectURL(source.objectUrl);
      }
    };
  }, [source]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement && !document.webkitIsFullScreen) {
      const el = playerContainerRef.current! as HTMLElement;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }

      if (isTouchDevice) {
        window.screen.orientation.lock('landscape').catch((e) => console.error(e));
      }

      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [playerRef, isTouchDevice]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (playerRef.current.paused) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [playerRef]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.muted = !playerRef.current.muted;
    setIsMuted(playerRef.current.muted);
  }, [playerRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'ArrowRight':
          if (playerRef.current) playerRef.current.currentTime += 5;
          break;
        case 'ArrowLeft':
          if (playerRef.current) playerRef.current.currentTime -= 5;
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (playerRef.current) {
            playerRef.current.volume = Math.min(1, playerRef.current.volume + 0.1);
            playerRef.current.muted = false;
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (playerRef.current) {
            playerRef.current.volume = Math.max(0, playerRef.current.volume - 0.1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerRef, toggleFullscreen, toggleMute, togglePlayPause]);

  const handleVolumeChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (!playerRef.current) return;
      const vol = typeof newValue === 'number' ? newValue : newValue[0];
      playerRef.current.muted = vol === 0 ? true : false;
      playerRef.current.volume = vol / 100;
      savePlayerSettings({ volume: vol, muted: playerRef.current.muted });
      setVolume(vol);
      setIsMuted(playerRef.current.muted);
      if (onUpdateSettings) onUpdateSettings({ volume: vol, muted: playerRef.current.muted });
    },
    [playerRef, onUpdateSettings]
  );

  const handleSeekChange = (event: Event, newValue: number | number[]) => {
    const seekValue = typeof newValue === 'number' ? newValue : newValue[0];
    if (playerRef.current) {
      playerRef.current.currentTime = seekValue;
      setCurrentTimeState(seekValue);
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    if (!playerRef.current) return;
    setPlaybackSpeed(speed);
    playerRef.current.playbackRate = speed;
  };

  const handleError = (_e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = playerRef.current;
    if (!video || !video.error) return;

    const code = video.error.code;
    switch (code) {
      case 1:
        setFileError('This video format is not supported by your browser');
        break;
      case 2:
        setFileError('Failed to decode the video file - it may be corrupted or use an unsupported codec');
        break;
      case 3:
        setFileError('Network error while loading the video - please check your connection');
        break;
      case 4:
        setFileError('Video loading was aborted');
        break;
      default:
        setFileError(`An error occurred while playing the video (Error code: ${code})`);
    }
  };

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setPlayerState(1);
    timeUpdate();
  }, [timeUpdate, setPlayerState]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setPlayerState(2);
  }, [setPlayerState]);

  const handleEnded = () => setPlayerState(0);
  const handleWaiting = () => setPlayerState(3);
  const handlePlaying = () => setPlayerState(1);

  const handleLoadedMetadata = () => {
    const dur = playerRef.current!.duration;
    setDuration(dur);

    const vodDuration = vod.duration;
    const tmpDelay = vodDuration - dur < 0 ? 0 : vodDuration - dur;
    setDelay?.(tmpDelay);
  };

  useEffect(() => {
    if (source && playerRef.current) {
      canAutoplay.video({ inline: true }).then(async (obj: { result: boolean }) => {
        if (!playerRef.current) return;

        if (obj.result) return (playerRef.current.muted = isMuted);

        let mutedAutoplay = await canAutoplay.video({ muted: true, inline: true });
        if (!playerRef.current) return;

        if (mutedAutoplay.result) return (playerRef.current.muted = true);

        setIsPlaying(false);
      });
    }
  }, [source, playerRef, isMuted]);

  useEffect(() => {
    if (!source || !playerRef.current) return;

    if (type === 'manual') {
      playerRef.current.src = typeof source === 'string' ? source : source.src;
    } else if (typeof source === 'string' && source.endsWith('.mp4')) {
      playerRef.current.src = source;
    }

    const set = async () => {
      let playerDuration = playerRef.current!.duration;
      while (playerRef.current && (isNaN(playerDuration) || playerDuration === 0)) {
        playerDuration = playerRef.current.duration;
        await sleep(100);
      }
      if (!playerRef.current) return;
      const vodDuration = vod.duration;
      const tmpDelay = vodDuration - playerDuration < 0 ? 0 : vodDuration - playerDuration;
      setDelay?.(tmpDelay);
      setDuration(playerDuration);
    };

    set();
  }, [source, type, setDelay, vod.duration, playerRef]);

  useEffect(() => {
    if (!playerRef.current || timestamp === undefined || !source) return;
    playerRef.current.currentTime = timestamp;
  }, [timestamp, source, playerRef]);

  const toggleTheatreMode = () => {
    setTheatreMode(!theatreMode);
  };

  return (
    <div className="h-full w-full">
      {type === 'manual' && !source && (
        <div className="flex items-center justify-center h-full flex-col bg-[#18181b] rounded-lg">
          {fileError && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 text-sm text-red-200 mb-2">
              {fileError}
            </div>
          )}
          <div className="mt-4">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block">
              Select Video
              <input type="file" hidden onChange={fileChange} accept="video/*,.mkv" />
            </label>
          </div>
        </div>
      )}

      <div
        ref={playerContainerRef}
        className="h-full w-full outline-none relative overflow-hidden"
        style={{ visibility: !source ? ('hidden' as const) : ('visible' as const) }}
      >
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
        />

        <div
          onClick={togglePlayPause}
          onDoubleClick={toggleFullscreen}
          className={`absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer transition-opacity duration-200 ${
            isPlaying ? 'opacity-0 pointer-events-none delay-75' : 'opacity-100 delay-75'
          }`}
        >
          <Play className="h-[15%] max-h-[72px] min-h-[32px] w-[15%] max-w-[72px] min-w-[32px] text-white drop-shadow-2xl" />
        </div>

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
          playerContainerRef={playerContainerRef}
          onPlaybackSpeedChange={handlePlaybackSpeedChange}
          onCopyTimestamp={copyTimestamp}
        />
      </div>
    </div>
  );
}
