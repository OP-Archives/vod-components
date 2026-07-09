import { useRef, useCallback } from 'react';
import { VOLUME_TOOLTIP_HALF_WIDTH, THUMB_WIDTH } from '../constants/player';
import type { Chapter } from '../types';
import { formatTime } from '../utils/helpers';

interface UseTooltipControlsOptions {
  duration: number;
  chapters?: Chapter[];
}

export interface UseTooltipControlsReturn {
  progressTooltipRef: React.RefObject<HTMLDivElement | null>;
  volumeTooltipRef: React.RefObject<HTMLDivElement | null>;
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
  getCurrentChapter: (time: number) => Chapter | undefined;
  getChapterAtPosition: (percentage: number) => Chapter | undefined;
}

export function useTooltipControls({ duration, chapters }: UseTooltipControlsOptions): UseTooltipControlsReturn {
  const progressTooltipRef = useRef<HTMLDivElement | null>(null);
  const volumeTooltipRef = useRef<HTMLDivElement | null>(null);
  const isDraggingVolume = useRef(false);

  const getCurrentChapter = useCallback(
    (time: number) => {
      if (!chapters || chapters.length === 0) return undefined;
      return chapters.find((ch) => time >= ch.start && time < ch.end);
    },
    [chapters]
  );

  const getChapterAtPosition = useCallback(
    (percentage: number) => {
      if (!chapters || chapters.length === 0) return undefined;
      const time = percentage * duration;
      return chapters.find((ch) => time >= ch.start && time < ch.end);
    },
    [chapters, duration]
  );

  const formatTooltipText = useCallback(
    (percentage: number) => {
      const timeText = formatTime(percentage * duration);
      if (!chapters || chapters.length === 0) return timeText;
      const chapter = chapters.find((ch) => {
        const t = percentage * duration;
        return t >= ch.start && t < ch.end;
      });
      if (!chapter) return timeText;
      return `<div style="text-align:center;line-height:1.3"><div style="font-weight:600">${chapter.name}</div><div style="color:#9ca3af;font-size:11px">${timeText}</div></div>`;
    },
    [duration, chapters]
  );

  const updateProgressTooltip = useCallback(
    (percentage: number, trackWidth: number) => {
      if (!progressTooltipRef.current) return;

      progressTooltipRef.current.innerHTML = formatTooltipText(percentage);

      const tooltipWidth = progressTooltipRef.current.offsetWidth;
      const halfWidth = tooltipWidth / 2;

      const pos = percentage * trackWidth;
      const clampedPos = Math.max(halfWidth, Math.min(pos, trackWidth - halfWidth));

      progressTooltipRef.current.style.left = `${clampedPos}px`;
      progressTooltipRef.current.style.opacity = '1';
    },
    [formatTooltipText]
  );

  const handleProgressMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!progressTooltipRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

      const trackWidth = Math.max(1, rect.width);
      const percentage = pos / trackWidth;
      updateProgressTooltip(percentage, trackWidth);
    },
    [updateProgressTooltip]
  );

  const handleProgressTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!progressTooltipRef.current || !e.touches[0]) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));

      const trackWidth = Math.max(1, rect.width);
      const percentage = pos / trackWidth;
      updateProgressTooltip(percentage, trackWidth);
    },
    [updateProgressTooltip]
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
    updateProgressTooltip,
    handleVolumeMouseMove,
    handleVolumeTouchMove,
    handleVolumeTouchEnd,
    handleVolumeMouseLeave,
    handleVolumeMouseUp,
    handleVolumeMouseDown,
    getCurrentChapter,
    getChapterAtPosition,
  };
}
