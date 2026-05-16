import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Maximize,
  Maximize2,
  Minimize,
  Minimize2,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
  Check,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import { formatTime } from '../utils/helpers';

const CONTROL_BAR_HEIGHT = 60;
const AUTO_HIDE_DELAY = 3000;

interface PlayerControlsProps {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  onTogglePlayPause: () => void;
  onVolumeChange: (event: Event, newValue: number | number[]) => void;
  onSeekChange: (event: Event, newValue: number | number[]) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
  theatreMode: boolean;
  onToggleTheatreMode: () => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  onCopyTimestamp?: (time: number) => void;
}

export default function PlayerControls(props: PlayerControlsProps) {
  const {
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isFullscreen,
    onTogglePlayPause,
    onVolumeChange,
    onSeekChange,
    onToggleMute,
    onToggleFullscreen,
    playerContainerRef,
    theatreMode,
    onToggleTheatreMode,
    playbackSpeed = 1,
    onPlaybackSpeedChange,
    onCopyTimestamp,
  } = props;

  const [showControls, setShowControls] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(250);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);
  const closeSettingsTimerRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const volumeBarRef = useRef<HTMLInputElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<number>(0);
  const [hoverVolume, setHoverVolume] = useState<number | null>(null);
  const [volTooltipPos, setVolTooltipPos] = useState<number>(0);
  const isDraggingVolume = useRef(false);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);

      if (!isMenuOpen) {
        autoHideTimerRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, AUTO_HIDE_DELAY);
      }
    };

    const handleMouseLeave = () => {
      if (isPlaying && !isMenuOpen) {
        setShowControls(false);
      }
    };

    const playerContainer = playerContainerRef.current;
    if (playerContainer) {
      playerContainer.addEventListener('mousemove', handleMouseMove);
      playerContainer.addEventListener('mouseleave', handleMouseLeave);
      playerContainer.addEventListener('click', handleMouseMove);
    }

    if (isMenuOpen) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      setShowControls(true);
    } else if (isPlaying) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, AUTO_HIDE_DELAY);
    }

    return () => {
      if (playerContainer) {
        playerContainer.removeEventListener('mousemove', handleMouseMove);
        playerContainer.removeEventListener('mouseleave', handleMouseLeave);
        playerContainer.removeEventListener('click', handleMouseMove);
      }
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [isPlaying, isMenuOpen, playerContainerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        settingsAnchorEl &&
        !settingsAnchorEl.contains(event.target as Node)
      ) {
        handleCloseSettings();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, settingsAnchorEl]);

  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (closeSettingsTimerRef.current) clearTimeout(closeSettingsTimerRef.current);
    };
  }, []);

  const [copied, setCopied] = useState(false);

  const handleCopyTimestamp = () => {
    if (onCopyTimestamp) {
      onCopyTimestamp(currentTime);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      handleCloseSettings();
    }, 600);
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    if (onPlaybackSpeedChange) {
      onPlaybackSpeedChange(speed);
    }
    handleCloseSettings();
  };

  const handleCloseSettings = () => {
    setIsMenuOpen(false);

    closeSettingsTimerRef.current = setTimeout(() => {
      setSettingsAnchorEl(null);
      setShowSpeedMenu(false);
    }, 250);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

    const percentage = pos / rect.width;
    setHoverTime(percentage * duration);

    const TOOLTIP_HALF_WIDTH = 30;
    const clampedPos = Math.max(TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - TOOLTIP_HALF_WIDTH));

    setTooltipPos(clampedPos);
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    if (!progressBarRef.current || !duration || !e.touches[0]) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));

    const percentage = pos / rect.width;
    setHoverTime(percentage * duration);

    const TOOLTIP_HALF_WIDTH = 30;
    const clampedPos = Math.max(TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - TOOLTIP_HALF_WIDTH));

    setTooltipPos(clampedPos);
  };

  const handleProgressTouchEnd = () => {
    setHoverTime(null);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!isDraggingVolume.current || !volumeBarRef.current) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

    const percentage = pos / rect.width;
    setHoverVolume(Math.round(percentage * 100));

    const TOOLTIP_HALF_WIDTH = 20;
    const clampedPos = Math.max(TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - TOOLTIP_HALF_WIDTH));

    setVolTooltipPos(clampedPos);
  };

  const handleVolumeTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    if (!volumeBarRef.current || !e.touches[0]) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));

    const percentage = pos / rect.width;
    setHoverVolume(Math.round(percentage * 100));

    const TOOLTIP_HALF_WIDTH = 20;
    const clampedPos = Math.max(TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - TOOLTIP_HALF_WIDTH));

    setVolTooltipPos(clampedPos);
  };

  const handleVolumeTouchEnd = () => {
    isDraggingVolume.current = false;
    setHoverVolume(null);
  };

  const handleVolumeMouseLeave = () => {
    isDraggingVolume.current = false;
    setHoverVolume(null);
  };

  const handleVolumeMouseDown = () => {
    isDraggingVolume.current = true;
  };

  const handleVolumeMouseUp = () => {
    isDraggingVolume.current = false;
    setHoverVolume(null);
  };

  const volumeGradient = `linear-gradient(to right, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.3) ${isMuted ? 0 : volume}%)`;
  const seekGradient = `linear-gradient(to right, white ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.3) ${duration ? (currentTime / duration) * 100 : 0}%)`;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex flex-col justify-end"
      style={{
        minHeight: CONTROL_BAR_HEIGHT,
        maxHeight: '30vh',
        transition: 'opacity 0.3s ease',
        opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none',
      }}
    >
      <div
        className="bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col px-2 pb-2 pt-10"
        style={{ gap: '4px' }}
      >
        <div className="flex items-center w-full group relative">
          {hoverTime !== null && (
            <div
              className="absolute bottom-full mb-3 bg-[#18181b] border border-[#303032] px-2 py-1 text-xs font-medium text-white rounded shadow-lg pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${tooltipPos}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          <input
            ref={progressBarRef}
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onSeekChange(new Event('') as unknown as Event, val);
            }}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-white transition-all group-hover:h-2"
            style={{ background: seekGradient }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center" style={{ gap: '6px' }}>
            <button
              onClick={onTogglePlayPause}
              className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <div className="flex items-center group/volume" style={{ gap: '6px' }}>
              <button
                onClick={onToggleMute}
                className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>

              <div className="relative h-6 flex items-center">
                {hoverVolume !== null && (
                  <div
                    className="absolute bottom-full mb-3 bg-[#18181b] border border-[#303032] px-2 py-1 text-xs font-medium text-white rounded shadow-lg pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${volTooltipPos}px` }}
                  >
                    {hoverVolume}%
                  </div>
                )}
                <input
                  ref={volumeBarRef}
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onVolumeChange(new Event('') as unknown as Event, val);
                  }}
                  onTouchStart={handleVolumeMouseDown}
                  onTouchEnd={handleVolumeTouchEnd}
                  onTouchMove={handleVolumeTouchMove}
                  onMouseDown={handleVolumeMouseDown}
                  onMouseUp={handleVolumeMouseUp}
                  onMouseMove={handleVolumeMouseMove}
                  onMouseLeave={handleVolumeMouseLeave}
                  className="h-1.5 rounded-lg appearance-none cursor-pointer accent-white transition-all w-12 min-w-[3rem] sm:w-[70px] sm:min-w-[70px]"
                  style={{ background: volumeGradient }}
                />
              </div>
            </div>

            <span className="font-medium text-white/90 tabular-nums tracking-wide text-[11px] sm:text-[13px] ml-1 sm:ml-2">
              {`${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          <div className="flex items-center relative" style={{ gap: '6px' }}>
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
              className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
              title="Settings"
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={onToggleTheatreMode}
              className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
              title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
            >
              {theatreMode ? (
                <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            <button
              onClick={onToggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            {settingsAnchorEl && isMenuOpen && (
              <div
                ref={settingsMenuRef}
                className="absolute bottom-full right-0 mb-4 bg-[#18181b] border border-[#303032] rounded-lg shadow-xl overflow-hidden animate-[fadeIn_0.2s_ease-out]"
              >
                {showSpeedMenu ? (
                  <>
                    <button
                      onClick={() => setShowSpeedMenu(false)}
                      className="flex items-center text-white hover:text-gray-300 transition-colors w-full text-left px-3 py-2 rounded"
                      style={{ gap: '8px' }}
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Back</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowSpeedMenu(true)}
                      className="flex items-center justify-between whitespace-nowrap text-white hover:text-gray-300 transition-colors w-full text-left px-3 py-2 rounded"
                    >
                      <span className="text-xs sm:text-sm">Playback Speed</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <hr className="border-[#303032] my-1" />
                    <button
                      onClick={handleCopyTimestamp}
                      className="flex items-center whitespace-nowrap text-white hover:text-gray-300 transition-colors w-full text-left px-3 py-2 rounded"
                      style={{ gap: '8px' }}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      <span className={`text-xs sm:text-sm ${copied ? 'text-green-400' : ''}`}>
                        {copied ? 'Copied!' : 'Copy Timestamp'}
                      </span>
                    </button>
                  </>
                )}
                {showSpeedMenu && (
                  <SimpleBar style={{ maxHeight: `${Math.min(250, menuMaxHeight - 40)}px` }}>
                    <div>
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handlePlaybackSpeedChange(speed)}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${playbackSpeed === speed ? 'bg-blue-600 text-white' : 'text-white hover:bg-[#2f2f35]'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </SimpleBar>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
