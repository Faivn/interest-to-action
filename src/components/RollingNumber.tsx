import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { SPRING_SWAP } from '../lib/motion';

/**
 * A number that rolls in from the direction of change (beUI Number Animation, rolling).
 * Enter-only: the previous value is replaced at once, so nothing can linger inline.
 */
export function RollingNumber({ value }: { value: number }) {
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  const changed = value !== previous.current;
  // Remember the value after commit, so render stays pure (StrictMode renders twice).
  useEffect(() => {
    previous.current = value;
  }, [value]);

  return (
    <span style={{ display: 'inline-flex', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <m.span
        key={value}
        style={{ display: 'inline-block' }}
        initial={changed ? { y: `${direction * 70}%`, opacity: 0 } : false}
        animate={{ y: '0%', opacity: 1 }}
        transition={SPRING_SWAP}
      >
        {value}
      </m.span>
    </span>
  );
}
