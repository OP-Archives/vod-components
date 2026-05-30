import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSettingsMenuOptions {
  isMenuOpen: boolean;
}

export interface UseSettingsMenuReturn {
  settingsAnchorEl: HTMLElement | null;
  setSettingsAnchorEl: (v: HTMLElement | null) => void;
  showSpeedMenu: boolean;
  setShowSpeedMenu: (v: boolean) => void;
  menuMaxHeight: number;
  setMenuMaxHeight: (v: number) => void;
  settingsMenuRef: React.RefObject<HTMLDivElement | null>;
  handleCloseSettings: () => void;
}

export function useSettingsMenu({ isMenuOpen }: UseSettingsMenuOptions): UseSettingsMenuReturn {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(250);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const closeSettingsTimerRef = useRef<number | null>(null);

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

  const handleCloseSettings = useCallback(() => {
    setSettingsAnchorEl(null);
    setShowSpeedMenu(false);

    closeSettingsTimerRef.current = setTimeout(() => {
      // no-op, cleanup handled below
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (closeSettingsTimerRef.current) clearTimeout(closeSettingsTimerRef.current);
    };
  }, []);

  return {
    settingsAnchorEl,
    setSettingsAnchorEl,
    showSpeedMenu,
    setShowSpeedMenu,
    menuMaxHeight,
    setMenuMaxHeight,
    settingsMenuRef,
    handleCloseSettings,
  };
}
