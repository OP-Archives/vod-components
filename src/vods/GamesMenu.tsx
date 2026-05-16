import humanize from 'humanize-duration';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import type { GameEntry, PartInfo } from '../types';
import { getImage } from '../utils/helpers';

interface GamesMenuProps {
  games: GameEntry[];
  part: PartInfo | null;
  setPart: (part: PartInfo) => void;
}

function GamesMenu({ games, part, setPart }: GamesMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; maxHeight: number }>({
    left: 0,
    maxHeight: 400,
  });
  const navigate = useNavigate();

  const currentGame = part ? games[part.part - 1] : null;

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

  const handleGameClick = (game: GameEntry, index: number) => {
    setPart({ part: index + 1, timestamp: 0 });
    navigate(`?game_id=${game.id}`, { replace: true });
    handleClose();
  };

  return (
    <div className="pr-2 relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="flex text-white hover:text-gray-300 transition-colors"
        title={currentGame?.game_name || ''}
      >
        <img
          alt=""
          src={getImage(currentGame?.chapter_image)}
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
                {games.map((game, index) => (
                  <button
                    onClick={() => handleGameClick(game, index)}
                    key={game.id}
                    className={`w-full text-left flex items-start gap-2 px-2 py-1.5 sm:px-3 sm:py-2 transition-colors ${
                      index === part!.part - 1 ? 'bg-[#2f2f35]' : 'hover:bg-[#2f2f35]'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <img
                        alt=""
                        src={getImage(game.chapter_image)}
                        width={40}
                        height={53}
                        decoding="async"
                        loading="lazy"
                        className="w-[30px] h-[40px] sm:w-[40px] sm:h-[53px]"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 w-full">
                      <span className="text-xs sm:text-sm text-[#efeff1] whitespace-normal break-words leading-snug">
                        {game.game_name}
                      </span>
                      {game.duration > 0 && (
                        <span className="text-xs text-[#adadb8] mt-0.5">{`${humanize(game.duration * 1000, { largest: 2 })}`}</span>
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

export default GamesMenu;
