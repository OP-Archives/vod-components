import { useState, useEffect } from 'react';

const BREAKPOINT_SMALL = 480;
const BREAKPOINT_MEDIUM = 768;
const MAX_PLAY_ICON_SIZE = 96;
const MEDIUM_PLAY_ICON_SIZE = 72;
const SMALL_PLAY_ICON_SIZE = 48;

interface UsePlayerStateOptions {
  playerRef: React.RefObject<HTMLVideoElement | null>;
  defaultVolume: number;
  defaultMuted: boolean;
}

export interface UsePlayerStateReturn {
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  currentTime: number;
  setCurrentTime: (v: number) => void;
  duration: number;
  setDuration: (v: number) => void;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (v: number) => void;
  isTouchDevice: boolean;
  playIconSize: number;
  isBuffering: boolean;
  setIsBuffering: (v: boolean) => void;
}

export function usePlayerState({
  playerRef,
  defaultVolume,
  defaultMuted,
}: UsePlayerStateOptions): UsePlayerStateReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume || 100);
  const [isMuted, setIsMuted] = useState(defaultMuted || false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [playIconSize, setPlayIconSize] = useState(96);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    const updatePlayIconSize = () => {
      if (window.innerWidth <= BREAKPOINT_SMALL) {
        setPlayIconSize(SMALL_PLAY_ICON_SIZE);
      } else if (window.innerWidth <= BREAKPOINT_MEDIUM) {
        setPlayIconSize(MEDIUM_PLAY_ICON_SIZE);
      } else {
        setPlayIconSize(MAX_PLAY_ICON_SIZE);
      }
    };
    updatePlayIconSize();
    window.addEventListener('resize', updatePlayIconSize);
    return () => window.removeEventListener('resize', updatePlayIconSize);
  }, []);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('player-settings') || '{"volume":100,"muted":false}');
    if (settings) {
      setVolume(settings.volume ?? 100);
      setIsMuted(settings.muted ?? false);
      if (playerRef.current) {
        // eslint-disable-next-line react-compiler/react-compiler -- DOM mutation on video element
        playerRef.current.volume = (settings.volume ?? 100) / 100;

        playerRef.current.muted = settings.muted ?? false;
      }
    }
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isFullscreen,
    setIsFullscreen,
    playbackSpeed,
    setPlaybackSpeed,
    isTouchDevice,
    playIconSize,
    isBuffering,
    setIsBuffering,
  };
}
