import { X, Plus, Trash2, Type, RotateCcw } from 'lucide-react';
import { useState, useEffect, ChangeEvent } from 'react';
import { useDebouncedCallback } from '../../utils/debounceHelper';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

const FONT_OPTIONS = [
  { label: 'System Sans', value: 'ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { label: 'Inter', value: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { label: 'Roboto', value: 'Roboto, ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { label: 'SF Pro', value: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: 'Source Sans 3', value: 'Source Sans 3, ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono, ui-monospace, Caskaydia Cove, monospace' },
  { label: 'SF Mono', value: 'SF Mono, ui-monospace, Cascadia Code, monospace' },
  { label: 'IBM Plex Mono', value: 'IBM Plex Mono, ui-monospace, monospace' },
  { label: 'Georgia (Serif)', value: 'Georgia, ui-serif, serif' },
  { label: 'System Serif', value: 'ui-serif, Georgia, Cambria, serif' },
];

const DEFAULT_SETTINGS = {
  chatWidth: undefined,
  showTimestamp: false,
  filterWords: [],
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  messageFontSize: 14,
  chatOnLeft: false,
};

interface ChatSettingsModalProps {
  userChatDelay: number;
  setUserChatDelay: (_v: number) => void;
  showModal: boolean;
  setShowModal: (_v: boolean) => void;
  showTimestamp: boolean;
  setShowTimestamp: (_v: boolean) => void;
  chatWidth: number | undefined;
  setChatWidth: (_v: number | undefined) => void;
  fontFamily: string;
  setFontFamily: (_v: string) => void;
  messageFontSize: number;
  setMessageFontSize: (_v: number) => void;
  chatOnLeft: boolean;
  setChatOnLeft: (_v: boolean) => void;
}

export default function ChatSettingsModal(props: ChatSettingsModalProps) {
  const {
    userChatDelay,
    setUserChatDelay,
    showModal,
    setShowModal,
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
  } = props;

  const [filterWords, setFilterWords] = useState<string[]>([]);
  const [customFont, setCustomFont] = useState('');
  const [showCustomFont, setShowCustomFont] = useState(false);
  const [rawDelay, setRawDelay] = useState(String(userChatDelay));
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    setRawDelay(String(userChatDelay));
  }, [userChatDelay]);

  useEffect(() => {
    if (showModal) {
      const savedSettings = safeLocalStorage.getItem('chatSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) || {};
          if (parsed.filterWords && Array.isArray(parsed.filterWords)) {
            setFilterWords(parsed.filterWords as string[]);
          }
          if (parsed.fontFamily && typeof parsed.fontFamily === 'string') {
            setFontFamily(parsed.fontFamily);
            setCustomFont('');
          }
          if (parsed.messageFontSize && typeof parsed.messageFontSize === 'number') {
            setMessageFontSize(parsed.messageFontSize);
          }
          if (parsed.chatOnLeft !== undefined) {
            setChatOnLeft(Boolean(parsed.chatOnLeft));
          }
        } catch (e) {
          console.error('Failed to parse chat settings from localStorage', e);
        }
      }
    }
  }, [showModal, setFontFamily, setMessageFontSize, setChatOnLeft]);

  const debouncedDelayChange = useDebouncedCallback((value: unknown) => {
    const num = Number(value);
    if (!isNaN(num)) {
      setUserChatDelay(num);
    }
  }, 300);

  const handleDelayChange = (value: string) => {
    setRawDelay(value);
    debouncedDelayChange(value);
  };

  const saveSetting = (key: string, value: unknown) => {
    if (value === undefined) {
      const savedSettings = safeLocalStorage.getItem('chatSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings) || {};
          delete settings[key];
          safeLocalStorage.setItem('chatSettings', JSON.stringify(settings));
        } catch {}
      }
      return;
    }
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
  };

  const debouncedSaveSetting = useDebouncedCallback((...args: unknown[]) => {
    saveSetting(args[0] as string, args[1]);
  }, 500);

  const handleAddWord = () => {
    const input = document.getElementById('filter-word-input') as HTMLInputElement | null;
    if (!input) return;
    const word = input.value.trim();
    if (word && !filterWords.includes(word)) {
      setFilterWords([...filterWords, word]);
      debouncedSaveSetting('filterWords', [...filterWords, word]);
      input.value = '';
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setFilterWords(filterWords.filter((word) => word !== wordToRemove));
    debouncedSaveSetting(
      'filterWords',
      filterWords.filter((word) => word !== wordToRemove)
    );
  };

  const handleFontChange = (value: string) => {
    setFontFamily(value);
    setCustomFont('');
    setShowCustomFont(false);
    saveSetting('fontFamily', value);
  };

  const handleCustomFontSubmit = () => {
    if (customFont.trim()) {
      setFontFamily(customFont.trim());
      saveSetting('fontFamily', customFont.trim());
    }
  };

  const handleFontSizeChange = (value: number) => {
    setMessageFontSize(value);
    saveSetting('messageFontSize', value);
  };

  const handleResetWidth = () => {
    setChatWidth(undefined);
    saveSetting('chatWidth', undefined);
  };

  const handleResetTimestamps = () => {
    setShowTimestamp(false);
    saveSetting('showTimestamp', false);
  };

  const handleResetFontFamily = () => {
    setFontFamily(DEFAULT_SETTINGS.fontFamily);
    saveSetting('fontFamily', DEFAULT_SETTINGS.fontFamily);
    setCustomFont('');
    setShowCustomFont(false);
  };

  const handleResetFontSize = () => {
    setMessageFontSize(DEFAULT_SETTINGS.messageFontSize);
    saveSetting('messageFontSize', DEFAULT_SETTINGS.messageFontSize);
  };

  const handleResetChatOnLeft = () => {
    setChatOnLeft(false);
    saveSetting('chatOnLeft', false);
  };

  const handleResetDelay = () => {
    setUserChatDelay(0);
  };

  const handleResetAll = () => {
    safeLocalStorage.removeItem('chatSettings');
    setFilterWords([]);
    setChatWidth(DEFAULT_SETTINGS.chatWidth);
    setShowTimestamp(DEFAULT_SETTINGS.showTimestamp);
    setFontFamily(DEFAULT_SETTINGS.fontFamily);
    setMessageFontSize(DEFAULT_SETTINGS.messageFontSize);
    setChatOnLeft(DEFAULT_SETTINGS.chatOnLeft);
    setUserChatDelay(0);
    document.documentElement.style.removeProperty('--chat-font-family');
    document.documentElement.style.removeProperty('--chat-font-size-message');
    document.documentElement.style.removeProperty('--chat-font-size-timestamp');
  };

  const sliderMin = 150;
  const sliderMax = 800;

  const selectedFont = FONT_OPTIONS.find((f) => f.value === fontFamily);

  return (
    <div
      onClick={() => setShowModal(false)}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${showModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`relative z-10 flex w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-[#222230] bg-[#16161e] shadow-2xl transition-transform duration-200 ${showModal ? 'scale-100' : 'scale-95'}`}
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#222230] bg-[#16161e] px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={() => setShowConfirmReset(true)}
            className="text-[#9ca3af] hover:text-[#f0f0f5]"
            title="Reset all settings to defaults"
          >
            <RotateCcw size={18} />
          </button>

          <h2 className="text-base font-semibold text-[#f0f0f5] sm:text-lg">Chat Settings</h2>

          <button onClick={() => setShowModal(false)} className="text-[#9ca3af] transition-colors hover:text-[#f0f0f5]">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="chat-scrollbar flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <p className="mb-2 text-sm font-medium text-[#9ca3af]">Font Family</p>
              <div className="flex gap-1.5 sm:gap-2">
                {!showCustomFont ? (
                  <>
                    <select
                      value={fontFamily}
                      onChange={(e) => handleFontChange(e.target.value)}
                      className="flex-1 rounded-lg border border-[#222230] bg-[#222230] px-3 py-2.5 text-sm text-[#f0f0f5] transition-all focus:border-[#6366f1] focus:outline-none"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                      <option value="__custom">Custom font...</option>
                    </select>
                    {selectedFont && (
                      <span className="flex items-center rounded-lg border border-[#222230] bg-[#222230] px-3 text-sm text-[#9ca3af]">
                        <Type size={16} />
                      </span>
                    )}
                    <button
                      onClick={handleResetFontFamily}
                      disabled={fontFamily === DEFAULT_SETTINGS.fontFamily}
                      className={`flex h-9 w-9 sm:h-[42px] sm:w-[42px] items-center justify-center self-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                        fontFamily === DEFAULT_SETTINGS.fontFamily
                          ? 'cursor-not-allowed opacity-40'
                          : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                      }`}
                      title="Reset font family"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-1 gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      value={customFont}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomFont(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                        e.key === 'Enter' && handleCustomFontSubmit()
                      }
                      placeholder="e.g. 'Fira Code', monospace"
                      className="flex-1 rounded-lg border border-[#222230] bg-[#222230] px-3 py-2.5 text-sm text-[#f0f0f5] transition-all focus:border-[#6366f1] focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleCustomFontSubmit}
                      className="rounded-lg border border-[#222230] bg-[#222230] px-3 text-[#9ca3af] transition-colors hover:text-[#f0f0f5]"
                    >
                      <Type size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomFont(false);
                        setCustomFont('');
                      }}
                      className="rounded-lg border border-[#222230] bg-[#222230] px-3 text-[#9ca3af] transition-colors hover:text-[#f0f0f5]"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={handleResetFontFamily}
                      disabled={fontFamily === DEFAULT_SETTINGS.fontFamily}
                      className={`flex h-[42px] w-[42px] items-center justify-center self-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                        fontFamily === DEFAULT_SETTINGS.fontFamily
                          ? 'cursor-not-allowed opacity-40'
                          : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                      }`}
                      title="Reset font family"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                )}
              </div>
              {!showCustomFont && !selectedFont && (
                <button
                  onClick={() => setShowCustomFont(true)}
                  className="mt-2 text-xs font-medium text-[#6366f1] hover:text-[#818cf8]"
                >
                  + Use custom font
                </button>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[#9ca3af]">Font Size</p>
              <div className="flex w-full items-center gap-2 sm:gap-3">
                <input
                  type="range"
                  min={10}
                  max={24}
                  step={1}
                  value={messageFontSize}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-[#222230] accent-[#6366f1]"
                />
                <span className="w-10 text-right text-sm font-medium whitespace-nowrap text-[#9ca3af]">
                  {messageFontSize}px
                </span>
                <button
                  onClick={handleResetFontSize}
                  disabled={messageFontSize === DEFAULT_SETTINGS.messageFontSize}
                  className={`flex h-9 w-9 sm:h-[38px] sm:w-[38px] items-center justify-center self-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                    messageFontSize === DEFAULT_SETTINGS.messageFontSize
                      ? 'cursor-not-allowed opacity-40'
                      : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                  }`}
                  title="Reset font size"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[#9ca3af]">Chat Width</p>
              <div className="flex w-full items-center gap-2 sm:gap-3">
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={5}
                  value={chatWidth ?? 340}
                  onChange={(e) => {
                    const num = parseInt(e.target.value);
                    setChatWidth(num);
                    debouncedSaveSetting('chatWidth', num);
                  }}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-[#222230] accent-[#6366f1]"
                />
                <span className="w-12 text-right text-sm font-medium whitespace-nowrap text-[#9ca3af]">
                  {chatWidth ?? 340}px
                </span>
                <button
                  onClick={handleResetWidth}
                  disabled={chatWidth == null || chatWidth === 340}
                  className={`flex h-9 w-9 sm:h-[38px] sm:w-[38px] items-center justify-center self-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                    chatWidth == null || chatWidth === 340
                      ? 'cursor-not-allowed opacity-40'
                      : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                  }`}
                  title="Reset chat width"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[#9ca3af]">Chat Delay</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-[#222230] bg-[#222230] px-3 py-2.5 text-sm text-[#f0f0f5] transition-all focus:border-[#6366f1] focus:outline-none"
                  value={rawDelay}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleDelayChange(e.target.value)}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                />
                <span className="text-sm font-medium whitespace-nowrap text-[#9ca3af]">secs</span>
                <button
                  onClick={handleResetDelay}
                  disabled={userChatDelay === 0}
                  className={`flex h-[42px] w-[42px] items-center justify-center self-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                    userChatDelay === 0 ? 'cursor-not-allowed opacity-40' : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                  }`}
                  title="Reset chat delay"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[#9ca3af]">Filter Words</p>
              <div className="mb-2 sm:mb-3 flex">
                <input
                  id="filter-word-input"
                  type="text"
                  className="flex-1 rounded-l-lg border border-[#222230] bg-[#222230] px-3 py-2.5 text-sm text-[#f0f0f5] transition-all focus:border-[#6366f1] focus:outline-none"
                  placeholder="Add word to filter"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddWord()}
                />
                <button
                  onClick={handleAddWord}
                  className="rounded-r-lg border border-l-0 border-[#222230] bg-[#222230] px-4 text-[#9ca3af] transition-colors hover:bg-[#222230] hover:text-[#f0f0f5]"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="chat-scrollbar max-h-[160px] overflow-y-auto rounded-lg border border-[#222230] bg-[#0c0c14] p-2 sm:p-3">
                {filterWords.length > 0 ? (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {filterWords.map((word, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-[#222230] bg-[#16161e] px-3 py-1.5"
                      >
                        <span className="text-sm text-[#f0f0f5]">{word}</span>
                        <button
                          onClick={() => handleRemoveWord(word)}
                          className="p-1 text-red-400 transition-colors hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-center text-sm text-[#5c5c65]">No filter words added</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#222230] p-2 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  id="show-timestamp"
                  checked={showTimestamp}
                  onChange={() => {
                    setShowTimestamp(!showTimestamp);
                    debouncedSaveSetting('showTimestamp', !showTimestamp);
                  }}
                  className="h-4 w-4 cursor-pointer rounded accent-[#6366f1]"
                />
                <label htmlFor="show-timestamp" className="cursor-pointer text-sm font-medium text-[#f0f0f5]">
                  Show Timestamps
                </label>
              </div>
              <button
                onClick={handleResetTimestamps}
                disabled={!showTimestamp}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                  !showTimestamp ? 'cursor-not-allowed opacity-40' : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                }`}
                title="Reset timestamps"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#222230] p-2 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  id="chat-on-left"
                  checked={chatOnLeft}
                  onChange={() => {
                    setChatOnLeft(!chatOnLeft);
                    saveSetting('chatOnLeft', !chatOnLeft);
                  }}
                  className="h-4 w-4 cursor-pointer rounded accent-[#6366f1]"
                />
                <label htmlFor="chat-on-left" className="cursor-pointer text-sm font-medium text-[#f0f0f5]">
                  Chat on Left
                </label>
              </div>
              <button
                onClick={handleResetChatOnLeft}
                disabled={!chatOnLeft}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#222230] bg-[#222230] transition-colors ${
                  !chatOnLeft ? 'cursor-not-allowed opacity-40' : 'text-[#9ca3af] hover:text-[#f0f0f5]'
                }`}
                title="Reset chat position"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmReset && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmReset(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-[340px] rounded-xl border border-[#222230] bg-[#16161e] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-5 text-sm text-[#9ca3af]">Are you sure you want to reset all settings to defaults?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="rounded-lg border border-[#222230] bg-[#222230] px-4 py-2 text-sm text-[#9ca3af] transition-colors hover:text-[#f0f0f5]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleResetAll();
                  setShowConfirmReset(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-500"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
