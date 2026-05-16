import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CustomWidthTooltip({
  children,
  title,
}: {
  children: React.ReactElement;
  title: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div
      ref={containerRef}
      className="inline-flex items-center min-w-0 max-w-full"
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
              width: 'max-content',
              maxWidth: 'calc(100vw - 2rem)',
            }}
          >
            <div className="rounded-lg border border-gray-700 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-lg animate-[fadeIn_0.2s_ease-out] whitespace-normal break-words">
              {title}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
