import humanize from 'humanize-duration';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Library,
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
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlayerControls } from '../hooks/usePlayerControls';
import type { Chapter } from '../types';
import { formatTime, toHMS, getImage } from '../utils/helpers';

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
  chapters?: Chapter[];
  currentChapter?: Chapter | null;
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
    chapters,
    currentChapter,
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
    handleProgressMouseLeave,
    updateProgressTooltip,
    handleVolumeMouseMove,
    handleVolumeTouchMove,
    handleVolumeTouchEnd,
    handleVolumeMouseLeave,
    handleVolumeMouseUp,
    handleVolumeMouseDown,
    handleCloseSettings,
  } = usePlayerControls({ isPlaying, playerContainerRef, duration, chapters });

  const [chaptersMenuOpen, setChaptersMenuOpen] = useState(false);
  const chaptersButtonRef = useRef<HTMLButtonElement>(null);
  const chaptersMenuRef = useRef<HTMLDivElement>(null);
  const [chaptersCoords, setChaptersCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    maxHeight: number;
  }>({
    left: 0,
    maxHeight: 400,
  });
  const [dragTime, setDragTime] = useState<number | null>(null);
  const displayTime = dragTime !== null ? dragTime : currentTime;

  const closeChaptersMenu = useCallback(() => {
    setChaptersMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!chaptersMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        chaptersMenuRef.current &&
        !chaptersMenuRef.current.contains(e.target as Node) &&
        chaptersButtonRef.current &&
        !chaptersButtonRef.current.contains(e.target as Node)
      ) {
        closeChaptersMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chaptersMenuOpen, closeChaptersMenu]);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef({
    isDragging: false,
    startX: 0,
    baseTime: 0,
    isFineScrubbing: false,
    trackWidth: 0,
    trackLeft: 0,
    trackTop: 0,
    hoverTrackWidth: 0,
    hoverTrackLeft: 0,
  });

  const handleChaptersClick = () => {
    if (!chaptersMenuOpen && chaptersButtonRef.current) {
      const rect = chaptersButtonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow > spaceAbove) {
        setChaptersCoords({
          top: rect.bottom + 8,
          bottom: undefined,
          left: rect.left,
          maxHeight: spaceBelow - 24,
        });
      } else {
        setChaptersCoords({
          top: undefined,
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          maxHeight: spaceAbove - 24,
        });
      }
    }
    setChaptersMenuOpen((v) => !v);
  };

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

  const handleChapterSeek = (chapter: Chapter) => {
    onSeekChange(new Event('input'), chapter.start);
    setChaptersMenuOpen(false);
  };

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
            className="pointer-events-none absolute bottom-full mb-3 -translate-x-1/2 transform rounded border border-[#222230] bg-[#16161e] px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity z-50"
            style={{ left: '0px' }}
          />
          <div
            ref={progressBarRef}
            className="relative flex h-4 w-full cursor-pointer items-center touch-none group"
            onPointerEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              dragOrigin.current.hoverTrackWidth = rect.width;
              dragOrigin.current.hoverTrackLeft = rect.left;
            }}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.setPointerCapture(e.pointerId);
              const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const newTime = percent * duration;
              dragOrigin.current = {
                isDragging: true,
                startX: e.clientX,
                baseTime: newTime,
                isFineScrubbing: false,
                trackWidth: rect.width,
                trackLeft: rect.left,
                trackTop: rect.top,
                hoverTrackWidth: rect.width,
                hoverTrackLeft: rect.left,
              };
              setDragTime(newTime);
            }}
            onPointerMove={(e) => {
              if (!dragOrigin.current.isDragging) {
                const { hoverTrackWidth, hoverTrackLeft } = dragOrigin.current;
                const pos = Math.max(0, Math.min(e.clientX - hoverTrackLeft, hoverTrackWidth));
                updateProgressTooltip(pos / hoverTrackWidth, hoverTrackWidth);
                return;
              }
              const { trackWidth, trackLeft, trackTop } = dragOrigin.current;
              const clientX = e.clientX;
              const verticalOffset = Math.max(0, trackTop - e.clientY);
              let newTime;
              const fineScrubEngaged = verticalOffset > 40;
              if (fineScrubEngaged) {
                if (!dragOrigin.current.isFineScrubbing) {
                  dragOrigin.current.startX = clientX;
                  dragOrigin.current.baseTime = dragTime !== null ? dragTime : currentTime;
                  dragOrigin.current.isFineScrubbing = true;
                }
                const deltaX = clientX - dragOrigin.current.startX;
                newTime = dragOrigin.current.baseTime + deltaX * 0.2;
                newTime = Math.max(0, Math.min(duration, newTime));
              } else {
                if (dragOrigin.current.isFineScrubbing) {
                  dragOrigin.current.isFineScrubbing = false;
                }
                const percent = Math.max(0, Math.min(1, (clientX - trackLeft) / trackWidth));
                newTime = percent * duration;
              }
              setDragTime(newTime);
              updateProgressTooltip(newTime / duration, trackWidth);
            }}
            onPointerUp={() => {
              if (dragOrigin.current.isDragging) {
                if (dragTime !== null) {
                  onSeekChange(new Event('input'), dragTime);
                }
                dragOrigin.current.isDragging = false;
                setDragTime(null);
                handleProgressMouseLeave();
              }
            }}
            onPointerCancel={() => {
              if (dragOrigin.current.isDragging) {
                dragOrigin.current.isDragging = false;
                setDragTime(null);
                handleProgressMouseLeave();
              }
            }}
            onPointerLeave={() => {
              if (!dragOrigin.current.isDragging) {
                handleProgressMouseLeave();
              }
            }}
          >
            {chapters && chapters.length > 0 && duration > 0 ? (
              <>
                {chapters.map((ch, i) => {
                  const isFirst = i === 0;
                  const isLast = i === chapters.length - 1;
                  const chapterStart = ch.start;
                  const chapterDuration = ch.end - ch.start;
                  const leftPct = (chapterStart / duration) * 100;
                  const widthPct = (chapterDuration / duration) * 100;
                  const fillPct =
                    displayTime >= chapterStart && displayTime < chapterStart + chapterDuration
                      ? ((displayTime - chapterStart) / chapterDuration) * 100
                      : displayTime >= chapterStart + chapterDuration
                        ? 100
                        : 0;
                  const radiusClass =
                    isFirst && isLast
                      ? 'rounded-full'
                      : isFirst
                        ? 'rounded-l-full rounded-r-[1px]'
                        : isLast
                          ? 'rounded-r-full rounded-l-[1px]'
                          : 'rounded-[1px]';
                  return (
                    <div
                      key={ch.start}
                      className="pointer-events-none absolute h-2 transition-[height] duration-200 group-hover:h-2.5"
                      style={{
                        left: `${leftPct}%`,
                        width: isLast ? `${widthPct}%` : `calc(${widthPct}% - 2px)`,
                      }}
                    >
                      <div
                        className={`absolute inset-0 bg-white/10 transition-[height] duration-200 group-hover:h-2.5 ${radiusClass}`}
                      />
                      <div
                        className={`absolute inset-y-0 left-0 bg-white transition-[height] duration-200 group-hover:h-2.5 ${radiusClass}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="relative flex h-full w-full items-center">
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10 transition-[height] duration-200 group-hover:h-2" />
                <div
                  className="absolute inset-y-0 left-0 h-1.5 rounded-full bg-white transition-[height] duration-200 group-hover:h-2"
                  style={{ width: `${duration ? (displayTime / duration) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>
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
              {`${formatTime(displayTime)} / ${formatTime(duration)}`}
            </span>
            {currentChapter && (
              <>
                <span className="mx-1 text-[11px] text-[#f0f0f5]/40 sm:mx-1.5">•</span>
                <span className="truncate max-w-[120px] text-[11px] font-medium text-[#f0f0f5]/60 sm:max-w-[180px] sm:text-[13px]">
                  {currentChapter.name}
                </span>
              </>
            )}
          </div>

          <div className="relative flex items-center" style={{ gap: '6px' }}>
            {chapters && chapters.length > 0 && (
              <>
                <button
                  ref={chaptersButtonRef}
                  type="button"
                  onClick={handleChaptersClick}
                  className="flex items-center justify-center text-[#f0f0f5] transition-colors hover:text-white"
                  title="Chapters"
                >
                  <Library className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                {chaptersMenuOpen &&
                  createPortal(
                    <div
                      ref={chaptersMenuRef}
                      className="fixed z-[1300] animate-[fadeIn_0.2s_ease-out] overflow-hidden rounded-xl border border-[#222230] bg-[#16161e] shadow-2xl"
                      style={{
                        top: chaptersCoords.top !== undefined ? chaptersCoords.top : 'auto',
                        bottom: chaptersCoords.bottom !== undefined ? chaptersCoords.bottom : 'auto',
                        left: chaptersCoords.left,
                        width: 'max-content',
                        minWidth: '200px',
                        maxWidth: '250px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ maxHeight: `${Math.min(400, chaptersCoords.maxHeight)}px`, overflowY: 'auto' }}>
                        <div className="flex flex-col">
                          {chapters.map((data) => (
                            <button
                              disabled={data.start === currentChapter?.start}
                              onClick={() => handleChapterSeek(data)}
                              key={`${data.name}-${data.start}`}
                              className={`flex w-full cursor-default items-start gap-2 px-2 py-1.5 text-left transition-colors sm:px-3 sm:py-2 ${
                                data.start === currentChapter?.start ? 'bg-[#1e1e2a]' : 'hover:bg-[#222230]'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                <img
                                  alt=""
                                  src={getImage(data.image)}
                                  width={40}
                                  height={53}
                                  decoding="async"
                                  loading="lazy"
                                  className="h-[40px] w-[30px] sm:h-[53px] sm:w-[40px]"
                                />
                              </div>
                              <div className="flex w-full min-w-0 flex-col">
                                <span className="text-xs leading-snug break-words whitespace-normal text-[#f0f0f5] sm:text-sm">
                                  {data.name}
                                </span>
                                {data.end !== undefined && (
                                  <span className="mt-0.5 text-xs text-[#9ca3af]">{`${humanize(data.duration * 1000, { largest: 2 })}`}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
              </>
            )}
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
                          {copied ? 'Copied!' : toHMS(Math.floor(displayTime))}
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
