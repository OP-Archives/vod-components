import { useState, useEffect, useRef } from 'react';

const AUTO_HIDE_DELAY = 3000;

interface UseAutoHideControlsOptions {
  isPlaying: boolean;
  isMenuOpen: boolean;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseAutoHideControlsReturn {
  showControls: boolean;
}

export function useAutoHideControls({
  isPlaying,
  isMenuOpen,
  playerContainerRef,
}: UseAutoHideControlsOptions): UseAutoHideControlsReturn {
  const [showControls, setShowControls] = useState(true);
  const autoHideTimerRef = useRef<number | null>(null);

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
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  return { showControls };
}
