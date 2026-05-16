import { X, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useDebouncedCallback } from '../../utils/debounceHelper';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface ChatSettingsModalProps {
  userChatDelay: number;
  setUserChatDelay: (v: number) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  showTimestamp: boolean;
  setShowTimestamp: (v: boolean) => void;
  chatWidth: number | undefined;
  setChatWidth: (v: number | undefined) => void;
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
  } = props;
  const [filterWords, setFilterWords] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showModal) {
      const savedSettings = safeLocalStorage.getItem('chatSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) || {};
          if (parsed.filterWords && Array.isArray(parsed.filterWords)) {
            setFilterWords(parsed.filterWords as string[]);
          }
        } catch (e) {
          console.error('Failed to parse chat settings from localStorage', e);
        }
      }
    }
  }, [showModal]);

  const debouncedDelayChange = useDebouncedCallback((value: unknown) => {
    if (!isNaN(Number(value))) {
      setUserChatDelay(Number(value));
    }
  }, 300);

  const saveSetting = (key: string, value: unknown) => {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-content') === null) {
      setShowModal(false);
    }
  };

  const sliderMin = 150;
  const sliderMax = typeof window !== 'undefined' ? Math.min(window.innerWidth - 400, 800) : 800;
  const sliderDisabled = typeof window !== 'undefined' && window.innerWidth - 400 <= 150;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${showModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="fixed inset-0 bg-black/80" />
      <div
        className={`relative z-10 w-[350px] bg-[#18181b] border border-[#303032] rounded-xl shadow-2xl p-6 transition-transform duration-200 modal-content ${showModal ? 'scale-100' : 'scale-95'}`}
      >
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-[#adadb8] hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-center text-white mb-5">Chat Settings</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#adadb8] mb-1.5">Chat Delay</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 bg-[#2f2f35] border border-[#3f3f46] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                value={userChatDelay}
                onChange={(e: ChangeEvent<HTMLInputElement>) => debouncedDelayChange(e.target.value)}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
              />
              <span className="text-sm text-[#8d8d98] whitespace-nowrap">secs</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-[#adadb8] mb-1.5">Chat Width</p>
            <div className="flex items-center w-full gap-2">
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={10}
                disabled={sliderDisabled}
                value={chatWidth ?? 340}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  setChatWidth(num);
                  debouncedSaveSetting('chatWidth', num);
                }}
                className="flex-1 h-1.5 bg-[#3f3f46] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-[#8d8d98] whitespace-nowrap">{chatWidth ?? 340}px</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-[#adadb8] mb-1.5">Filter Words</p>
            <div className="flex mb-2">
              <input
                id="filter-word-input"
                type="text"
                className="flex-1 bg-[#2f2f35] border border-[#3f3f46] rounded-l-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Add word to filter"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddWord()}
              />
              <button
                onClick={handleAddWord}
                className="bg-[#2f2f35] border border-[#3f3f46] border-l-0 rounded-r-lg px-3 text-[#adadb8] hover:text-white hover:bg-[#3f3f46] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="max-h-[150px] overflow-y-auto border border-[#3f3f46] rounded-lg p-2 chat-scrollbar">
              {filterWords.length > 0 ? (
                filterWords.map((word, index) => (
                  <div key={index} className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#efeff1]">{word}</span>
                    <button
                      onClick={() => handleRemoveWord(word)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5c5c65]">No filter words added</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-timestamp"
              checked={showTimestamp}
              onChange={() => {
                setShowTimestamp(!showTimestamp);
                debouncedSaveSetting('showTimestamp', !showTimestamp);
              }}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <label htmlFor="show-timestamp" className="text-sm text-[#adadb8]">
              Show Timestamps
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
