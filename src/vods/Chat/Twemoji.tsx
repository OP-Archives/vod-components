import { useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import twemoji from 'twemoji';

interface TwemojiProps extends PropsWithChildren {
  options?: Record<string, unknown>;
}

export function Twemoji({ children, options = {} }: TwemojiProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      twemoji.parse(ref.current, {
        folder: 'svg',
        ext: '.svg',
        ...options,
      });
    }
  }, [children, options]);
  return <span ref={ref}>{children}</span>;
}

// vite-plugin-dts doesn't resolve global.d.ts twemoji declarations; tsc handles it fine
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const testEmoji = (text: string): boolean => (twemoji as any).test(text);
