import { useState, useCallback } from 'react';
import type { Chapter } from '../types';
import { useAutoHideControls } from './useAutoHideControls';
import { useSettingsMenu } from './useSettingsMenu';
import { useTooltipControls } from './useTooltipControls';

interface UsePlayerControlsOptions {
  isPlaying: boolean;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
  duration: number;
  chapters?: Chapter[];
}

export interface UsePlayerControlsReturn {
  showControls: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
  settingsAnchorEl: HTMLElement | null;
  setSettingsAnchorEl: (v: HTMLElement | null) => void;
  showSpeedMenu: boolean;
  setShowSpeedMenu: (v: boolean) => void;
  menuMaxHeight: number;
  setMenuMaxHeight: (v: number) => void;
  progressTooltipRef: React.RefObject<HTMLDivElement | null>;
  volumeTooltipRef: React.RefObject<HTMLDivElement | null>;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  handleProgressMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  handleProgressTouchMove: (e: React.TouchEvent<HTMLElement>) => void;
  handleProgressTouchEnd: () => void;
  handleProgressMouseLeave: () => void;
  updateProgressTooltip: (percentage: number, trackWidth: number) => void;
  handleVolumeMouseMove: (e: React.MouseEvent<HTMLInputElement>) => void;
  handleVolumeTouchMove: (e: React.TouchEvent<HTMLInputElement>) => void;
  handleVolumeTouchEnd: () => void;
  handleVolumeMouseLeave: () => void;
  handleVolumeMouseUp: () => void;
  handleVolumeMouseDown: () => void;
  handleCloseSettings: () => void;
  getCurrentChapter: (time: number) => Chapter | undefined;
}

export function usePlayerControls({
  isPlaying,
  playerContainerRef,
  duration,
  chapters,
}: UsePlayerControlsOptions): UsePlayerControlsReturn {
  const [isMenuOpen, _setIsMenuOpen] = useState(false);

  const { showControls } = useAutoHideControls({
    isPlaying,
    isMenuOpen,
    playerContainerRef,
  });

  const tooltipControls = useTooltipControls({ duration, chapters });

  const {
    settingsAnchorEl,
    setSettingsAnchorEl,
    showSpeedMenu,
    setShowSpeedMenu,
    menuMaxHeight,
    setMenuMaxHeight,
    settingsMenuRef,
    handleCloseSettings,
  } = useSettingsMenu({ isMenuOpen });

  const setIsMenuOpen = useCallback((v: boolean) => {
    _setIsMenuOpen(v);
  }, []);

  const wrappedHandleCloseSettings = useCallback(() => {
    setIsMenuOpen(false);
    handleCloseSettings();
  }, [setIsMenuOpen, handleCloseSettings]);

  return {
    showControls,
    isMenuOpen,
    setIsMenuOpen,
    settingsAnchorEl,
    setSettingsAnchorEl,
    showSpeedMenu,
    setShowSpeedMenu,
    menuMaxHeight,
    setMenuMaxHeight,
    progressTooltipRef: tooltipControls.progressTooltipRef,
    volumeTooltipRef: tooltipControls.volumeTooltipRef,
    settingsMenuRef,
    handleProgressMouseMove: tooltipControls.handleProgressMouseMove,
    handleProgressTouchMove: tooltipControls.handleProgressTouchMove,
    handleProgressTouchEnd: tooltipControls.handleProgressTouchEnd,
    handleProgressMouseLeave: tooltipControls.handleProgressMouseLeave,
    updateProgressTooltip: tooltipControls.updateProgressTooltip,
    handleVolumeMouseMove: tooltipControls.handleVolumeMouseMove,
    handleVolumeTouchMove: tooltipControls.handleVolumeTouchMove,
    handleVolumeTouchEnd: tooltipControls.handleVolumeTouchEnd,
    handleVolumeMouseLeave: tooltipControls.handleVolumeMouseLeave,
    handleVolumeMouseUp: tooltipControls.handleVolumeMouseUp,
    handleVolumeMouseDown: tooltipControls.handleVolumeMouseDown,
    handleCloseSettings: wrappedHandleCloseSettings,
    getCurrentChapter: tooltipControls.getCurrentChapter,
  };
}
