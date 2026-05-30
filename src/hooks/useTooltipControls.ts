import { useRef, useCallback } from 'react';
import { PROGRESS_TOOLTIP_HALF_WIDTH, VOLUME_TOOLTIP_HALF_WIDTH, THUMB_WIDTH } from '../constants/player';
import { formatTime } from '../utils/helpers';

interface UseTooltipControlsOptions {
  duration: number;
}

export interface UseTooltipControlsReturn {
  progressTooltipRef: React.RefObject<HTMLDivElement | null>;
  volumeTooltipRef: React.RefObject<HTMLDivElement | null>;
  handleProgressMouseMove: (e: React.MouseEvent<HTMLInputElement>) => void;
  handleProgressTouchMove: (e: React.TouchEvent<HTMLInputElement>) => void;
  handleProgressTouchEnd: () => void;
  handleProgressMouseLeave: () => void;
  handleVolumeMouseMove: (e: React.MouseEvent<HTMLInputElement>) => void;
  handleVolumeTouchMove: (e: React.TouchEvent<HTMLInputElement>) => void;
  handleVolumeTouchEnd: () => void;
  handleVolumeMouseLeave: () => void;
  handleVolumeMouseUp: () => void;
  handleVolumeMouseDown: () => void;
}

export function useTooltipControls({ duration }: UseTooltipControlsOptions): UseTooltipControlsReturn {
  const progressTooltipRef = useRef<HTMLDivElement | null>(null);
  const volumeTooltipRef = useRef<HTMLDivElement | null>(null);
  const isDraggingVolume = useRef(false);

  const handleProgressMouseMove = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      if (!progressTooltipRef.current) return;

      const rect = (e.target as HTMLInputElement).getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

      const trackWidth = Math.max(1, rect.width - THUMB_WIDTH);
      const adjustedPos = Math.max(0, Math.min(pos - THUMB_WIDTH / 2, trackWidth));
      const percentage = adjustedPos / trackWidth;
      const clampedPos = Math.max(PROGRESS_TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - PROGRESS_TOOLTIP_HALF_WIDTH));

      progressTooltipRef.current.style.left = `${clampedPos}px`;
      progressTooltipRef.current.innerText = formatTime(percentage * duration);
      progressTooltipRef.current.style.opacity = '1';
    },
    [duration]
  );

  const handleProgressTouchMove = useCallback(
    (e: React.TouchEvent<HTMLInputElement>) => {
      if (!progressTooltipRef.current || !e.touches[0]) return;

      const rect = (e.target as HTMLInputElement).getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));

      const trackWidth = Math.max(1, rect.width - THUMB_WIDTH);
      const adjustedPos = Math.max(0, Math.min(pos - THUMB_WIDTH / 2, trackWidth));
      const percentage = adjustedPos / trackWidth;
      const clampedPos = Math.max(PROGRESS_TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - PROGRESS_TOOLTIP_HALF_WIDTH));

      progressTooltipRef.current.style.left = `${clampedPos}px`;
      progressTooltipRef.current.innerText = formatTime(percentage * duration);
      progressTooltipRef.current.style.opacity = '1';
    },
    [duration]
  );

  const handleProgressTouchEnd = useCallback(() => {
    if (progressTooltipRef.current) progressTooltipRef.current.style.opacity = '0';
  }, []);

  const handleProgressMouseLeave = useCallback(() => {
    if (progressTooltipRef.current) progressTooltipRef.current.style.opacity = '0';
  }, []);

  const handleVolumeMouseMove = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    if (!isDraggingVolume.current || !volumeTooltipRef.current) return;

    const rect = (e.target as HTMLInputElement).getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

    const trackWidth = Math.max(1, rect.width - THUMB_WIDTH);
    const adjustedPos = Math.max(0, Math.min(pos - THUMB_WIDTH / 2, trackWidth));
    const percentage = adjustedPos / trackWidth;
    const clampedPos = Math.max(VOLUME_TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - VOLUME_TOOLTIP_HALF_WIDTH));

    volumeTooltipRef.current.style.left = `${clampedPos}px`;
    volumeTooltipRef.current.innerText = `${Math.round(percentage * 100)}%`;
    volumeTooltipRef.current.style.opacity = '1';
  }, []);

  const handleVolumeTouchMove = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    if (!volumeTooltipRef.current || !e.touches[0]) return;

    const rect = (e.target as HTMLInputElement).getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));

    const trackWidth = Math.max(1, rect.width - THUMB_WIDTH);
    const adjustedPos = Math.max(0, Math.min(pos - THUMB_WIDTH / 2, trackWidth));
    const percentage = adjustedPos / trackWidth;
    const clampedPos = Math.max(VOLUME_TOOLTIP_HALF_WIDTH, Math.min(pos, rect.width - VOLUME_TOOLTIP_HALF_WIDTH));

    volumeTooltipRef.current.style.left = `${clampedPos}px`;
    volumeTooltipRef.current.innerText = `${Math.round(percentage * 100)}%`;
    volumeTooltipRef.current.style.opacity = '1';
  }, []);

  const handleVolumeTouchEnd = useCallback(() => {
    isDraggingVolume.current = false;
    if (volumeTooltipRef.current) volumeTooltipRef.current.style.opacity = '0';
  }, []);

  const handleVolumeMouseLeave = useCallback(() => {
    isDraggingVolume.current = false;
    if (volumeTooltipRef.current) volumeTooltipRef.current.style.opacity = '0';
  }, []);

  const handleVolumeMouseUp = useCallback(() => {
    isDraggingVolume.current = false;
    if (volumeTooltipRef.current) volumeTooltipRef.current.style.opacity = '0';
  }, []);

  const handleVolumeMouseDown = useCallback(() => {
    isDraggingVolume.current = true;
  }, []);

  return {
    progressTooltipRef,
    volumeTooltipRef,
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
  };
}
