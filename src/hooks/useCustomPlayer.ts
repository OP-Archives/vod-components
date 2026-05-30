import type { VOD, PlayerState, PlayerSettings, PlayerSource } from '../types';
import { useHlsPlayer } from './useHlsPlayer';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePlayerState } from './usePlayerState';
import { useVideoControls } from './useVideoControls';

interface UseCustomPlayerOptions {
  type?: string;
  vod: VOD;
  cdnBase?: string;
  playerRef: React.RefObject<HTMLVideoElement | null>;
  setCurrentTime: (_time: number) => void;
  setDelay?: (_delay: number) => void;
  setPlayerState: (_state: PlayerState) => void;
  defaultVolume: number;
  defaultMuted: boolean;
  onUpdateSettings?: (_settings: PlayerSettings) => void;
}

export interface UseCustomPlayerReturn {
  source: PlayerSource;
  setSource: React.Dispatch<React.SetStateAction<PlayerSource>>;
  fileError: string | undefined;
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

export function useCustomPlayer({
  type,
  vod,
  cdnBase,
  playerRef,
  setDelay,
  setPlayerState,
  defaultVolume,
  defaultMuted,
  onUpdateSettings,
}: UseCustomPlayerOptions): UseCustomPlayerReturn {
  const playerState = usePlayerState({
    playerRef,
    defaultVolume,
    defaultMuted,
  });

  const hlsPlayer = useHlsPlayer({
    type,
    cdnBase,
    platformVodId: vod.platform_vod_id,
    playerRef,
  });

  const videoControls = useVideoControls({
    type,
    playerRef,
    isTouchDevice: playerState.isTouchDevice,
    isMuted: playerState.isMuted,
    source: hlsPlayer.source,
    vodDuration: vod.duration,
    setDelay,
    onUpdateSettings,
    setIsPlaying: playerState.setIsPlaying,
    setIsBuffering: playerState.setIsBuffering,
    setPlayerState,
    setCurrentTime: playerState.setCurrentTime,
    setDuration: playerState.setDuration,
    setIsMuted: playerState.setIsMuted,
    setVolume: playerState.setVolume,
    setPlaybackSpeed: playerState.setPlaybackSpeed,
    setIsFullscreen: playerState.setIsFullscreen,
  });

  useKeyboardShortcuts({
    playerRef,
    toggleFullscreen: videoControls.toggleFullscreen,
    toggleMute: videoControls.toggleMute,
    togglePlayPause: videoControls.togglePlayPause,
  });

  return {
    source: hlsPlayer.source,
    setSource: hlsPlayer.setSource,
    fileError: hlsPlayer.fileError,
    isPlaying: playerState.isPlaying,
    setIsPlaying: playerState.setIsPlaying,
    volume: playerState.volume,
    setVolume: playerState.setVolume,
    isMuted: playerState.isMuted,
    setIsMuted: playerState.setIsMuted,
    currentTime: playerState.currentTime,
    setCurrentTime: playerState.setCurrentTime,
    duration: playerState.duration,
    setDuration: playerState.setDuration,
    isFullscreen: playerState.isFullscreen,
    setIsFullscreen: playerState.setIsFullscreen,
    playbackSpeed: playerState.playbackSpeed,
    setPlaybackSpeed: playerState.setPlaybackSpeed,
    isTouchDevice: playerState.isTouchDevice,
    playIconSize: playerState.playIconSize,
    isBuffering: playerState.isBuffering,
    setIsBuffering: playerState.setIsBuffering,
    toggleFullscreen: videoControls.toggleFullscreen,
    togglePiP: videoControls.togglePiP,
    togglePlayPause: videoControls.togglePlayPause,
    toggleMute: videoControls.toggleMute,
    handleVolumeChange: videoControls.handleVolumeChange,
    handleSeekChange: videoControls.handleSeekChange,
    handlePlaybackSpeedChange: videoControls.handlePlaybackSpeedChange,
    handleError: videoControls.handleError,
    timeUpdate: videoControls.timeUpdate,
    handlePlay: videoControls.handlePlay,
    handlePause: videoControls.handlePause,
    handleEnded: videoControls.handleEnded,
    handleWaiting: videoControls.handleWaiting,
    handlePlaying: videoControls.handlePlaying,
    handleLoadedMetadata: videoControls.handleLoadedMetadata,
  };
}
