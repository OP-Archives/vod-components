import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import canAutoplay from 'can-autoplay';
import Hls from 'hls.js';
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

interface PlayerProps {
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
  const timeIntervalRef = useRef<number | null>(null);
  const [source, setSource] = useState<PlayerSource>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume || 100);
  const [isMuted, setIsMuted] = useState(defaultMuted || false);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');

  const stopLoop = useCallback(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
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
    if (type === 'cdn') {
      const hlsUrl = `${cdnBase}/videos/${vod.platform_vod_id}/hls/${vod.platform_vod_id}.m3u8`;
      setSource(hlsUrl);

      if (Hls.isSupported()) {
        hlsInstance.current = new Hls(hlsConfig);
        hlsInstance.current.loadSource(hlsUrl);
        hlsInstance.current.attachMedia(playerRef.current!);

        hlsInstance.current.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance.current!.destroy();
                break;
              default:
                hlsInstance.current!.destroy();
                setFileError('Failed to load video');
                break;
            }
          }
        });
      } else if (playerRef.current!.canPlayType('application/vnd.apple.mpegurl')) {
        playerRef.current!.src = hlsUrl;
      }
    }

    return () => {
      if (hlsInstance.current) hlsInstance.current.destroy();
      stopLoop();
    };
  }, [type, cdnBase, vod, playerRef, stopLoop]);

  const timeUpdate = useCallback(() => {
    if (!playerRef.current || playerRef.current.paused) return;
    const currentTime = playerRef.current.currentTime ?? 0;
    setCurrentTimeState(currentTime);
  }, [playerRef]);

  const startLoop = useCallback(() => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    timeIntervalRef.current = setInterval(timeUpdate, 1000);
  }, [timeUpdate]);

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
    startLoop();
  }, [timeUpdate, startLoop, setPlayerState]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setPlayerState(2);
    stopLoop();
  }, [stopLoop, setPlayerState]);

  const handleEnded = () => setPlayerState(0);
  const handleWaiting = () => setPlayerState(3);
  const handlePlaying = () => setPlayerState(1);

  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
      setCurrentTimeState(playerRef.current.currentTime);
    }
  };

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
    <Box sx={{ height: '100%', width: '100%' }}>
      {type === 'manual' && !source && (
        <Paper
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
          }}
        >
          {fileError && <Alert severity="error">{fileError}</Alert>}
          <Box sx={{ mt: 1 }}>
            <Button variant="contained" component="label">
              Select Video
              <input type="file" hidden onChange={fileChange} accept="video/*,.mkv" />
            </Button>
          </Box>
        </Paper>
      )}

      <Box
        ref={playerContainerRef}
        sx={{
          visibility: !source ? 'hidden' : 'visible',
          height: '100%',
          width: '100%',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
        onDoubleClick={toggleFullscreen}
      >
        <video
          ref={playerRef}
          playsInline
          autoPlay
          tabIndex={-1}
          poster={vod.vod_uploads[0]?.thumbnail_url || undefined}
          preload="auto"
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          style={{ height: '100%', width: '100%' }}
        />

        {!isPlaying && (
          <Box
            onClick={togglePlayPause}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              cursor: 'pointer',
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 80, color: 'white' }} />
          </Box>
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
          playerContainerRef={playerContainerRef}
          onPlaybackSpeedChange={handlePlaybackSpeedChange}
          onCopyTimestamp={copyTimestamp}
        />
      </Box>
    </Box>
  );
}
