import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from '../utils/debounceHelper';
import { safeLocalStorage } from '../utils/safeLocalStorage';

const DEFAULT_CHAT_WIDTH_MOBILE = 250;
const DEFAULT_CHAT_WIDTH_TABLET = 300;
const DEFAULT_CHAT_WIDTH_DESKTOP = 340;

const DEFAULT_SETTINGS = {
  chatWidth: undefined as number | undefined,
  showTimestamp: false,
  filterWords: [] as string[],
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  messageFontSize: 14,
  chatOnLeft: false,
  userChatDelay: 0,
};

function getResponsiveDefaultWidth(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window.innerWidth;
  if (w <= 600) return DEFAULT_CHAT_WIDTH_MOBILE;
  if (w <= 900) return DEFAULT_CHAT_WIDTH_TABLET;
  return DEFAULT_CHAT_WIDTH_DESKTOP;
}

export interface UseChatSettingsReturn {
  showTimestamp: boolean;
  setShowTimestamp: (v: boolean) => void;
  chatWidth: number | undefined;
  setChatWidth: (v: number | undefined) => void;
  fontFamily: string;
  setFontFamily: (v: string) => void;
  messageFontSize: number;
  setMessageFontSize: (v: number) => void;
  chatOnLeft: boolean;
  setChatOnLeft: (v: boolean) => void;
  filterRegex: RegExp | null;
  setFilterRegex: (v: RegExp | null) => void;
  userChatDelay: number;
  setUserChatDelay: (v: number) => void;
  resetAll: () => void;
  saveSetting: (key: string, value: unknown) => void;
}

export function useChatSettings(): UseChatSettingsReturn {
  const [showTimestamp, setShowTimestamp] = useState(DEFAULT_SETTINGS.showTimestamp);
  const [chatWidth, setChatWidth] = useState<number | undefined>(DEFAULT_SETTINGS.chatWidth);
  const [fontFamily, setFontFamily] = useState(DEFAULT_SETTINGS.fontFamily);
  const [messageFontSize, setMessageFontSize] = useState(DEFAULT_SETTINGS.messageFontSize);
  const [chatOnLeft, setChatOnLeft] = useState(DEFAULT_SETTINGS.chatOnLeft);
  const [filterRegex, setFilterRegex] = useState<RegExp | null>(null);
  const [userChatDelay, setUserChatDelay] = useState(DEFAULT_SETTINGS.userChatDelay);
  const filterRegexRef = useRef<RegExp | null>(null);

  useEffect(() => {
    filterRegexRef.current = filterRegex;
  }, [filterRegex]);

  const loadSettings = useCallback(() => {
    const savedSettings = safeLocalStorage.getItem('chatSettings');
    let hasChatWidth = false;

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);

        if (settings.chatWidth !== undefined) {
          setChatWidth(settings.chatWidth as number);
          hasChatWidth = true;
        }
        if (settings.showTimestamp !== undefined) {
          setShowTimestamp(Boolean(settings.showTimestamp));
        }
        if (settings.fontFamily && typeof settings.fontFamily === 'string') {
          setFontFamily(settings.fontFamily);
          document.documentElement.style.setProperty('--chat-font-family', settings.fontFamily);
        }
        if (settings.messageFontSize && typeof settings.messageFontSize === 'number') {
          setMessageFontSize(settings.messageFontSize);
          document.documentElement.style.setProperty('--chat-font-size-message', `${settings.messageFontSize}px`);
          document.documentElement.style.setProperty(
            '--chat-font-size-timestamp',
            `${Math.round(settings.messageFontSize * 0.857)}px`
          );
        }
        if (settings.chatOnLeft !== undefined) {
          setChatOnLeft(Boolean(settings.chatOnLeft));
        }
        if (settings.userChatDelay !== undefined) {
          setUserChatDelay(Number(settings.userChatDelay));
        }

        const words = (settings.filterWords as string[]) || [];
        if (words.length > 0) {
          const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          setFilterRegex(new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi'));
        } else {
          setFilterRegex(null);
        }
      } catch (e) {
        console.error('Failed to parse chat settings from localStorage', e);
      }
    }

    if (!hasChatWidth) {
      const responsiveDefault = getResponsiveDefaultWidth();
      if (responsiveDefault !== undefined) {
        setChatWidth(responsiveDefault);
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-font-family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-font-size-message', `${messageFontSize}px`);
    document.documentElement.style.setProperty(
      '--chat-font-size-timestamp',
      `${Math.round(messageFontSize * 0.857)}px`
    );
  }, [messageFontSize]);

  useEffect(() => {
    const loadFilterRegex = () => {
      const savedSettings = safeLocalStorage.getItem('chatSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          const words = (settings.filterWords as string[]) || [];
          if (words.length > 0) {
            const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            setFilterRegex(new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi'));
          } else {
            setFilterRegex(null);
          }
        } catch (e) {
          console.error('Failed to parse filter words', e);
        }
      }
    };

    loadFilterRegex();
    window.addEventListener('chat-settings-updated', loadFilterRegex);
    return () => window.removeEventListener('chat-settings-updated', loadFilterRegex);
  }, []);

  const saveSetting = useCallback((key: string, value: unknown) => {
    const savedSettings = safeLocalStorage.getItem('chatSettings');
    let settings: Record<string, unknown> = {};
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings) || {};
      } catch (e) {
        console.error('Failed to parse chat settings from localStorage', e);
      }
    }
    settings[key] = value;
    safeLocalStorage.setItem('chatSettings', JSON.stringify(settings));

    if (key === 'filterWords') {
      window.dispatchEvent(new Event('chat-settings-updated'));
    }
  }, []);

  const debouncedDelayChange = useDebouncedCallback((value: unknown) => {
    if (!isNaN(Number(value))) {
      setUserChatDelay(Number(value));
    }
  }, 300);

  const resetAll = useCallback(() => {
    safeLocalStorage.removeItem('chatSettings');
    setChatWidth(DEFAULT_SETTINGS.chatWidth);
    setShowTimestamp(DEFAULT_SETTINGS.showTimestamp);
    setFontFamily(DEFAULT_SETTINGS.fontFamily);
    setMessageFontSize(DEFAULT_SETTINGS.messageFontSize);
    setChatOnLeft(DEFAULT_SETTINGS.chatOnLeft);
    setUserChatDelay(DEFAULT_SETTINGS.userChatDelay);
    setFilterRegex(null);
    document.documentElement.style.removeProperty('--chat-font-family');
    document.documentElement.style.removeProperty('--chat-font-size-message');
    document.documentElement.style.removeProperty('--chat-font-size-timestamp');
  }, []);

  return {
    showTimestamp,
    setShowTimestamp,
    chatWidth,
    setChatWidth,
    fontFamily,
    setFontFamily,
    messageFontSize,
    setMessageFontSize,
    chatOnLeft,
    setChatOnLeft,
    filterRegex,
    setFilterRegex,
    userChatDelay,
    setUserChatDelay: debouncedDelayChange,
    resetAll,
    saveSetting,
  };
}
