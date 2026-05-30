import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Maximize,
  Maximize2,
  Minimize,
  Minimize2,
  Pause,
  PictureInPicture2,
  Play,
  Settings,
  Volume2,
  VolumeX,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { usePlayerControls } from '../hooks/usePlayerControls';
import { formatTime, toHMS } from '../utils/helpers';

interface PlayerControlsProps {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  onTogglePlayPause: () => void;
  onVolumeChange: (_event: Event, _newValue: number | number[]) => void;
  onSeekChange: (_event: Event, _newValue: number | number[]) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
  theatreMode: boolean;
  onToggleTheatreMode: () => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (_speed: number) => void;
  onCopyTimestamp?: (_time: number) => void;
}

export default function PlayerControls(props: PlayerControlsProps) {
  const {
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isFullscreen,
    onVolumeChange,
    onSeekChange,
    playerContainerRef,
    onToggleFullscreen,
    onTogglePiP,
    theatreMode,
    onToggleTheatreMode,
    playbackSpeed = 1,
    onPlaybackSpeedChange,
    onCopyTimestamp,
    onTogglePlayPause,
    onToggleMute,
  } = props;

  const {
    showControls,
    isMenuOpen,
    setIsMenuOpen,
    settingsAnchorEl,
    setSettingsAnchorEl,
    showSpeedMenu,
    setShowSpeedMenu,
    setMenuMaxHeight,
    progressTooltipRef,
    volumeTooltipRef,
    settingsMenuRef,
    handleProgressMouseMove,
    handleProgressTouchMove,
    handleProgressTouchEnd,
    handleProgressMouseLeave,
    handleVolumeMouseMove,
    handleVolumeTouchMove,
    handleVolumeTouchEnd,
    handleVolumeMouseLeave,
    handleVolumeMouseUp,
    handleVolumeMouseDown,
    handleCloseSettings,
  } = usePlayerControls({ isPlaying, playerContainerRef, duration });

  const [copied, setCopied] = useState(false);

  const handleCopyTimestamp = () => {
    if (onCopyTimestamp) onCopyTimestamp(currentTime);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      handleCloseSettings();
    }, 600);
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    onPlaybackSpeedChange?.(speed);
    handleCloseSettings();
  };

  const volumeGradient = `linear-gradient(to right, #ffffff ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.3) ${isMuted ? 0 : volume}%)`;
  const seekGradient = `linear-gradient(to right, #ffffff ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.3) ${duration ? (currentTime / duration) * 100 : 0}%)`;

  return (
    <div
      className="absolute right-0 bottom-0 left-0 flex flex-col justify-end"
      style={{
        minHeight: 60,
        maxHeight: '30vh',
        transition: 'opacity 0.3s ease',
        opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none',
      }}
    >
      <div className="flex flex-col rounded-t-xl bg-[#0a0a0f]/85 px-2 pb-2 backdrop-blur-md" style={{ gap: '4px' }}>
        <div className="group relative flex w-full items-center">
          <div
            ref={progressTooltipRef}
            className="pointer-events-none absolute bottom-full mb-3 -translate-x-1/2 transform rounded border border-[#222230] bg-[#16161e] px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity"
            style={{ left: '0px' }}
          />
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            step="any"
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onSeekChange(e.nativeEvent, val);
            }}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg accent-white transition-all group-hover:h-2"
            style={{ background: seekGradient }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '6px' }}>
            <button
              onClick={onTogglePlayPause}
              className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            <div className="group/volume flex items-center" style={{ gap: '6px' }}>
              <button
                onClick={onToggleMute}
                className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>

              <div className="relative flex h-6 items-center">
                <div
                  ref={volumeTooltipRef}
                  className="pointer-events-none absolute bottom-full mb-3 -translate-x-1/2 transform rounded border border-[#222230] bg-[#16161e] px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity"
                  style={{ left: '0px' }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  step="any"
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onVolumeChange(e.nativeEvent, val);
                  }}
                  onTouchStart={handleVolumeMouseDown}
                  onTouchEnd={handleVolumeTouchEnd}
                  onTouchMove={handleVolumeTouchMove}
                  onMouseDown={handleVolumeMouseDown}
                  onMouseUp={handleVolumeMouseUp}
                  onMouseMove={handleVolumeMouseMove}
                  onMouseLeave={handleVolumeMouseLeave}
                  className="h-1.5 w-12 min-w-[3rem] cursor-pointer appearance-none rounded-lg accent-white transition-all sm:w-[70px] sm:min-w-[70px]"
                  style={{ background: volumeGradient }}
                />
              </div>
            </div>

            <span className="ml-1 text-[11px] font-medium tracking-wide text-[#f0f0f5]/90 tabular-nums sm:ml-2 sm:text-[13px]">
              {`${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          <div className="relative flex items-center" style={{ gap: '6px' }}>
            <button
              onClick={(e) => {
                if (isMenuOpen && settingsAnchorEl === e.currentTarget) {
                  handleCloseSettings();
                } else {
                  if (playerContainerRef.current) {
                    const playerHeight = playerContainerRef.current.clientHeight;
                    setMenuMaxHeight(Math.max(80, playerHeight - 90));
                  }
                  setSettingsAnchorEl(e.currentTarget);
                  setIsMenuOpen(true);
                }
              }}
              className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
              title="Settings"
            >
              <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              onClick={onTogglePiP}
              className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              onClick={onToggleTheatreMode}
              className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
              title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
            >
              {theatreMode ? (
                <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>

            <button
              onClick={onToggleFullscreen}
              className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>

            {settingsAnchorEl && isMenuOpen && (
              <div
                ref={settingsMenuRef}
                className="absolute right-0 bottom-full mb-3 w-56 animate-[fadeIn_0.2s_ease-out] overflow-hidden rounded-xl border border-[#222230] bg-[#16161e] shadow-xl"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
              >
                {showSpeedMenu ? (
                  <div>
                    <button
                      onClick={() => setShowSpeedMenu(false)}
                      className="flex w-full items-center gap-2.5 border-b border-[#222230] px-4 py-2.5 text-left text-sm font-medium text-[#f0f0f5] transition-colors hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    <div
                      className="max-h-60 overflow-y-auto p-1.5"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#222230 transparent',
                      }}
                    >
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handlePlaybackSpeedChange(speed)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all ${
                            playbackSpeed === speed
                              ? 'bg-white/15 text-white'
                              : 'text-[#f0f0f5] hover:bg-[#222230]/60 hover:text-white'
                          }`}
                        >
                          <span className="font-medium">{speed}x</span>
                          {playbackSpeed === speed && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-1.5">
                    <button
                      onClick={() => setShowSpeedMenu(true)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#f0f0f5] transition-all hover:bg-[#222230]/60 hover:text-white"
                    >
                      Playback Speed
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#9ca3af]">{playbackSpeed}x</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </div>
                    </button>
                    <hr className="my-1.5 border-[#222230]" />
                    <button
                      onClick={handleCopyTimestamp}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                        copied ? 'text-green-400' : 'text-[#f0f0f5] hover:bg-[#222230]/60 hover:text-white'
                      }`}
                    >
                      Copy Timestamp
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#9ca3af]">
                          {copied ? 'Copied!' : toHMS(Math.floor(currentTime))}
                        </span>
                        {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
