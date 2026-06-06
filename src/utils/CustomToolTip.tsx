import { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomWidthTooltipProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

export default function CustomWidthTooltip({ title, placement = 'top', children }: CustomWidthTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, align: 'center' });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    let newAlign = 'center';
    let newLeft = clientX;

    if (placement === 'top' || placement === 'bottom') {
      const safeThreshold = 224;

      if (clientX < safeThreshold) {
        newAlign = 'left';
        newLeft = clientX + 8;
      } else if (window.innerWidth - clientX < safeThreshold) {
        newAlign = 'right';
        newLeft = clientX - 8;
      }
    }

    setCoords({ top: clientY, left: newLeft, align: newAlign });
    setIsHovered(true);
  };

  if (!title) return <>{children}</>;

  const getTransform = () => {
    if (placement === 'top') {
      if (coords.align === 'left') return 'translate(0, calc(-100% - 16px))';
      if (coords.align === 'right') return 'translate(-100%, calc(-100% - 16px))';
      return 'translate(-50%, calc(-100% - 16px))';
    }
    if (placement === 'bottom') {
      if (coords.align === 'left') return 'translate(0, 16px)';
      if (coords.align === 'right') return 'translate(-100%, 16px)';
      return 'translate(-50%, 16px)';
    }
    if (placement === 'left') return 'translate(calc(-100% - 16px), -50%)';
    if (placement === 'right') return 'translate(16px, -50%)';
    return 'translate(-50%, calc(-100% - 16px))';
  };

  return (
    <div className="group relative inline-flex max-w-full min-w-0 items-center">
      <span className="contents" onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsHovered(false)}>
        {children}
      </span>

      {isHovered &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1300] transition-all duration-150 ease-[0.25,0.4,0.25,1]"
            style={{
              top: coords.top,
              left: coords.left,
              transform: getTransform(),
              opacity: 1,
              maxWidth: 'calc(100vw - 2rem)',
            }}
          >
            <div className="rounded border border-[#222230] bg-[#16161e] px-3 py-1.5 text-sm break-words whitespace-normal text-white shadow-lg">
              {title}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
