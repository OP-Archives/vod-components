import debounce from 'lodash.debounce';
import { useRef, useEffect } from 'react';

export const useDebouncedCallback = (
  callback: (...args: unknown[]) => void,
  delay: number
): ((...args: unknown[]) => void) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useRef(
    debounce((...args: unknown[]) => {
      callbackRef.current(...args);
    }, delay)
  );

  useEffect(() => {
    const currentDebouncedFn = debouncedFn.current;
    return () => currentDebouncedFn.cancel();
  }, []);

  return debouncedFn.current;
};

export const useDebouncedSetter = (setter: (value: unknown) => void, delay: number): ((value: unknown) => void) => {
  const setterRef = useRef(setter);

  useEffect(() => {
    setterRef.current = setter;
  }, [setter]);

  const debouncedFn = useRef(
    debounce((value: unknown) => {
      if (value !== undefined && value !== '' && value !== null) {
        setterRef.current(value);
      }
    }, delay)
  );

  useEffect(() => {
    const currentDebouncedFn = debouncedFn.current;
    return () => currentDebouncedFn.cancel();
  }, []);

  return debouncedFn.current;
};
