import humanize from 'humanize-duration';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SimpleBar from 'simplebar-react';
import type { Chapter, VODUpload, PartInfo } from '../types';
import { toSeconds, getImage } from '../utils/helpers';

interface VodChaptersProps {
  chapters: Chapter[];
  chapter: { name: string; image: string; start: number; duration: number; end: number } | null;
  setPart?: (part: PartInfo) => void;
  youtube?: VODUpload[];
  setChapter: (ch: { name: string; image: string; start: number; duration: number; end: number } | null) => void;
  setTimestamp?: (ts: number) => void;
  isYoutubeVod?: boolean;
}

function VodChapters({
  chapters,
  chapter,
  setPart,
  youtube,
  setChapter,
  setTimestamp,
  isYoutubeVod,
}: VodChaptersProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; maxHeight: number }>({
    left: 0,
    maxHeight: 400,
  });

  const handleClose = () => {
    setMenuOpen(false);
  };

  const handleClick = () => {
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow > spaceAbove) {
        setCoords({
          top: rect.bottom + 8,
          bottom: undefined,
          left: rect.left,
          maxHeight: spaceBelow - 24,
        });
      } else {
        setCoords({
          top: undefined,
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          maxHeight: spaceAbove - 24,
        });
      }
    }
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const handleOutsideInteraction = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        handleClose();
        return;
      }

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        if (event.type !== 'keydown') handleClose();
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('wheel', handleOutsideInteraction, { capture: true, passive: true });
      document.addEventListener('touchmove', handleOutsideInteraction, { capture: true, passive: true });
      document.addEventListener('keydown', handleOutsideInteraction);
      window.addEventListener('resize', handleClose);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('wheel', handleOutsideInteraction, { capture: true });
      document.removeEventListener('touchmove', handleOutsideInteraction, { capture: true });
      document.removeEventListener('keydown', handleOutsideInteraction);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuOpen]);

  const handleChapterClick = (data: Chapter) => {
    if (isYoutubeVod && youtube) {
      let part = 1;
      let timestamp = data?.start;
      if (timestamp! > 1) {
        for (let data of youtube) {
          if ((data.duration ?? 0) > timestamp!) {
            part = data?.part || 1;
            break;
          }
          timestamp! -= data.duration ?? 0;
        }
      }
      setPart?.({ part: part, timestamp: timestamp! });
    } else {
      setTimestamp?.(data?.start || toSeconds(data.duration.toString()));
    }
    setChapter(data);
    handleClose();
  };

  return (
    <div className="pr-2 relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="flex text-white hover:text-gray-300 transition-colors"
        title={chapter!.name}
      >
        <img
          alt=""
          src={getImage(chapter!.image)}
          width={40}
          height={53}
          decoding="async"
          loading="lazy"
          className="w-[30px] h-[40px] sm:w-[40px] sm:h-[53px] block rounded-sm"
        />
      </button>

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1300] bg-[#18181b] border border-[#303032] rounded-xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]"
            style={{
              top: coords.top !== undefined ? coords.top : 'auto',
              bottom: coords.bottom !== undefined ? coords.bottom : 'auto',
              left: coords.left,
              width: 'max-content',
              minWidth: '200px',
              maxWidth: 'calc(100vw - 32px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SimpleBar style={{ maxHeight: `${Math.min(400, coords.maxHeight)}px` }}>
              <div className="flex flex-col">
                {chapters.map((data) => (
                  <button
                    onClick={() => handleChapterClick(data)}
                    key={`${data.name}-${data.start}`}
                    className={`w-full text-left flex items-start gap-2 px-2 py-1.5 sm:px-3 sm:py-2 transition-colors ${
                      data.start === chapter!.start ? 'bg-[#2f2f35]' : 'hover:bg-[#2f2f35]'
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
                        className="w-[30px] h-[40px] sm:w-[40px] sm:h-[53px]"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 w-full">
                      <span className="text-xs sm:text-sm text-[#efeff1] whitespace-normal break-words leading-snug">
                        {data.name}
                      </span>
                      {data.end !== undefined && (
                        <span className="text-xs text-[#adadb8] mt-0.5">{`${humanize(data.duration * 1000, { largest: 2 })}`}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </SimpleBar>
          </div>,
          document.body
        )}
    </div>
  );
}

export default VodChapters;
