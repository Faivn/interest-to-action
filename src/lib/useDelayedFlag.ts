import { useEffect, useState } from 'react';

/** Becomes true only after `value` has stayed true for `delayMs` — avoids flashing loaders on fast loads. */
export function useDelayedFlag(value: boolean, delayMs: number): boolean {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    if (!value) {
      setDelayed(false);
      return;
    }
    const timer = window.setTimeout(() => setDelayed(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return value && delayed;
}
