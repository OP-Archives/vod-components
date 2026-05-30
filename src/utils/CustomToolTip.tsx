import { ReactNode, useState } from 'react';

interface CustomWidthTooltipProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

export default function CustomWidthTooltip({ title, placement = 'top', children }: CustomWidthTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, align: 'center' });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.currentTarget.querySelector('span') || e.currentTarget) as HTMLElement;
    const rect = el.getBoundingClientRect();

    let newAlign = 'center';
    let newLeft = rect.left + rect.width / 2;

    if (placement === 'top' || placement === 'bottom') {
      const safeThreshold = 224;

      if (newLeft < safeThreshold) {
        newAlign = 'left';
        newLeft = rect.left;
      } else if (window.innerWidth - newLeft < safeThreshold) {
        newAlign = 'right';
        newLeft = rect.right;
      }
    }

    setCoords({ top: rect.top, left: newLeft, align: newAlign });
    setIsHovered(true);
  };

  if (!title) return <>{children}</>;

  const getTransform = () => {
    if (placement === 'top') {
      if (coords.align === 'left') return 'translate(0, calc(-100% - 8px))';
      if (coords.align === 'right') return 'translate(-100%, calc(-100% - 8px))';
      return 'translate(-50%, calc(-100% - 8px))';
    }
    if (placement === 'bottom') {
      if (coords.align === 'left') return 'translate(0, 8px)';
      if (coords.align === 'right') return 'translate(-100%, 8px)';
      return 'translate(-50%, 8px)';
    }
    if (placement === 'left') return 'translate(calc(-100% - 8px), -50%)';
    if (placement === 'right') return 'translate(8px, -50%)';
    return 'translate(-50%, calc(-100% - 8px))';
  };

  return (
    <div
      className="group relative inline-flex max-w-full min-w-0 items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {isHovered && (
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
        </div>
      )}
    </div>
  );
}
