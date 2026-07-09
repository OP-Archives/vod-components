import canAutoplay from 'can-autoplay';
import { useEffect, useCallback } from 'react';
import type { PlayerSource, PlayerSettings, PlayerState } from '../types';
import { sleep } from '../utils/helpers';
import { hasWebkitRequestFullscreen, hasWebkitEnterFullscreen } from '../utils/typeGuards';

interface UseVideoControlsOptions {
  type?: string;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  isTouchDevice: boolean;
  isMuted: boolean;
  source: PlayerSource;
  vodDuration: number;
  setDelay?: (_delay: number) => void;
  onUpdateSettings?: (_settings: PlayerSettings) => void;
  setIsPlaying: (v: boolean) => void;
  setIsBuffering: (v: boolean) => void;
  setPlayerState: (_state: PlayerState) => void;
  setCurrentTime: (v: number) => void;
  setDuration: (v: number) => void;
  setIsMuted: (v: boolean) => void;
  setVolume: (v: number) => void;
  setPlaybackSpeed: (v: number) => void;
  setIsFullscreen: (v: boolean) => void;
}

export interface UseVideoControlsReturn {
  toggleFullscreen: () => void;
  togglePiP: () => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  handleVolumeChange: (_event: Event, newValue: number | number[]) => void;
  handleSeekChange: (_event: Event, newValue: number | number[]) => void;
  handlePlaybackSpeedChange: (speed: number) => void;
  handleError: (_e: React.SyntheticEvent<HTMLVideoElement>) => void;
  timeUpdate: () => void;
  handlePlay: () => void;
  handlePause: () => void;
  handleEnded: () => void;
  handleWaiting: () => void;
  handlePlaying: () => void;
  handleLoadedMetadata: () => void;
}

export function useVideoControls({
  type,
  playerRef,
  isTouchDevice,
  isMuted,
  source,
  vodDuration,
  setDelay,
  onUpdateSettings,
  setIsPlaying,
  setIsBuffering,
  setPlayerState,
  setCurrentTime,
  setDuration,
  setIsMuted,
  setVolume,
  setPlaybackSpeed,
  setIsFullscreen,
}: UseVideoControlsOptions): UseVideoControlsReturn {
  const timeUpdate = useCallback(() => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.currentTime ?? 0;
    setCurrentTime(currentTime);
  }, [playerRef, setCurrentTime]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement && !document.webkitIsFullScreen) {
      const el = (playerRef.current.parentElement as HTMLElement) || document.fullscreenElement;
      const target = el || playerRef.current.parentElement;
      if (target && target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target && hasWebkitRequestFullscreen(target)) {
        target.webkitRequestFullscreen?.();
      } else if (playerRef.current && hasWebkitEnterFullscreen(playerRef.current)) {
        playerRef.current.webkitEnterFullscreen?.();
      }

      if (isTouchDevice) {
        try {
          window.screen.orientation.lock('landscape').catch(() => {});
        } catch {
          // iOS Safari blocks orientation lock — user must rotate physically
        }
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
  }, [playerRef, isTouchDevice, setIsFullscreen]);

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
  }, [playerRef, setIsMuted]);

  const handleVolumeChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      if (!playerRef.current) return;
      const vol = typeof newValue === 'number' ? newValue : newValue[0];

      playerRef.current.muted = vol === 0 ? true : false;

      playerRef.current.volume = vol / 100;
      setVolume(vol);
      setIsMuted(playerRef.current.muted);
      if (onUpdateSettings) onUpdateSettings({ volume: vol, muted: playerRef.current.muted });
    },
    [playerRef, onUpdateSettings, setVolume, setIsMuted]
  );

  const handleSeekChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      const seekValue = typeof newValue === 'number' ? newValue : newValue[0];
      if (playerRef.current) {
        playerRef.current.currentTime = seekValue;
        setCurrentTime(seekValue);
      }
    },
    [playerRef, setCurrentTime]
  );

  const handlePlaybackSpeedChange = useCallback(
    (speed: number) => {
      if (!playerRef.current) return;
      setPlaybackSpeed(speed);

      playerRef.current.playbackRate = speed;
    },
    [playerRef, setPlaybackSpeed]
  );

  const handleError = useCallback(
    (_e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = playerRef.current;
      if (!video || !video.error) return;

      const code = video.error.code;
      switch (code) {
        case 1:
          // This video format is not supported by your browser
          break;
        case 2:
          // Failed to decode the video file
          break;
        case 3:
          // Network error while loading the video
          break;
        case 4:
          // Video loading was aborted
          break;
        default:
          break;
      }
    },
    [playerRef]
  );

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setPlayerState(1);
    timeUpdate();
  }, [timeUpdate, setIsPlaying, setPlayerState]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setPlayerState(2);
  }, [setIsPlaying, setPlayerState]);

  const handleEnded = useCallback(() => setPlayerState(0), [setPlayerState]);
  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
    setPlayerState(3);
  }, [setIsBuffering, setPlayerState]);

  const handlePlaying = useCallback(() => {
    setIsBuffering(false);
    setPlayerState(1);
  }, [setIsBuffering, setPlayerState]);

  const handleLoadedMetadata = useCallback(() => {
    const dur = playerRef.current!.duration;
    setDuration(dur);

    const tmpDelay = vodDuration - dur < 0 ? 0 : vodDuration - dur;
    setDelay?.(tmpDelay);
  }, [playerRef, vodDuration, setDelay, setDuration]);

  useEffect(() => {
    if (source && playerRef.current) {
      canAutoplay.video({ inline: true }).then(async (obj: { result: boolean }) => {
        if (!playerRef.current) return;

        // eslint-disable-next-line react-compiler/react-compiler -- DOM mutation on video element
        if (obj.result) return (playerRef.current.muted = isMuted);

        const mutedAutoplay = await canAutoplay.video({ muted: true, inline: true });
        if (!playerRef.current) return;

        if (mutedAutoplay.result) return (playerRef.current.muted = true);

        setIsPlaying(false);
      });
    }
  }, [source, playerRef, isMuted, setIsPlaying]);

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
      const tmpDelay = vodDuration - playerDuration < 0 ? 0 : vodDuration - playerDuration;
      setDelay?.(tmpDelay);
      setDuration(playerDuration);
    };

    set();
  }, [source, type, setDelay, vodDuration, playerRef]);

  useEffect(() => {
    if (!playerRef.current || source === undefined) return;
    playerRef.current.currentTime = 0;
  }, [source, playerRef]);

  const togglePiP = useCallback(async () => {
    const video = playerRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
  }, [playerRef]);

  return {
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
  };
}
