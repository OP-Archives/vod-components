import { useCallback, useRef } from 'react';

export function useDebouncedCallback(callback: (...args: unknown[]) => void, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<unknown[]>([]);

  return useCallback(
    (...args: unknown[]) => {
      argsRef.current = args;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        callback(...argsRef.current);
      }, delay);
    },
    [callback, delay]
  );
}
