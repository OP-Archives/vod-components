import { useEffect, useRef } from 'react';
import twemoji from 'twemoji';

export function Twemoji({ children, options = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      twemoji.parse(ref.current, {
        folder: 'svg',
        ext: '.svg',
        ...options,
      });
    }
  }, [children]);
  return <span ref={ref}>{children}</span>;
}

export const testEmoji = (text) => twemoji.test(text);
