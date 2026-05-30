import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MessageTooltip({ children, title }: { children: React.ReactElement; title: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isHovered]);

  return (
    <span
      ref={containerRef}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1300]"
            style={{
              top: coords.top,
              left: coords.left,
              transform: 'translate(-50%, calc(-100% - 8px))',
            }}
          >
            <div className="w-fit animate-[fadeIn_0.2s_ease-out] rounded-lg border border-[#222230] bg-[#16161e] p-2 text-sm text-[#f0f0f5] shadow-lg">
              {title}
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}
