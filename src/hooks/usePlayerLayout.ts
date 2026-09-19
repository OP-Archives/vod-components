import { useState, useEffect, useCallback } from 'react';

const CHAT_ON_LEFT_KEY = 'chat-on-left';

export interface UsePlayerLayoutReturn {
  isPortrait: boolean;
  chatOnLeft: boolean;
  setChatOnLeft: (v: boolean) => void;
}

export function usePlayerLayout(): UsePlayerLayoutReturn {
  const [isPortrait, setIsPortrait] = useState(false);
  const [chatOnLeft, setChatOnLeftState] = useState(() => {
    try {
      return localStorage.getItem(CHAT_ON_LEFT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Desktop: width-based breakpoints (stricter for portrait-oriented displays); touch devices: orientation-based
    const mql = window.matchMedia(
      `(pointer: fine) and (orientation: landscape) and (max-width: 1024px),
       (pointer: fine) and (orientation: portrait) and (max-width: 1440px),
       (pointer: coarse) and (orientation: portrait)`
    );
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => setIsPortrait(e.matches);
    setIsPortrait(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setChatOnLeft = useCallback((v: boolean) => {
    setChatOnLeftState(v);
    try {
      localStorage.setItem(CHAT_ON_LEFT_KEY, String(v));
    } catch {
      // localStorage not available
    }
  }, []);

  return { isPortrait, chatOnLeft, setChatOnLeft };
}
