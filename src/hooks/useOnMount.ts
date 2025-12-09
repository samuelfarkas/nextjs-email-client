import { useEffect, useRef, type EffectCallback } from 'react';

/**
 * Runs a callback only once when the component mounts.
 * This hook intentionally ignores dependencies to avoid ESLint warnings.
 */
export function useOnMount(callback: EffectCallback): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return callbackRef.current();
  }, []);
}
