import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Check } from 'lucide-react';
import { SPRING_PRESS, SPRING_SWAP, SWAP_VARIANTS } from '../lib/motion';
import './Button.css';
import './StatefulButton.css';

export type ButtonState = 'idle' | 'loading' | 'success';

interface StatefulButtonProps {
  state: ButtonState;
  /** Label for the idle state. */
  children: ReactNode;
  successLabel?: string;
  loadingLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Primary action that swaps idle → loading → success in place (beUI Action Swap / StatefulButton):
 * labels trade with a blur swap, the width morphs to fit, and the state is announced politely.
 */
export function StatefulButton({
  state,
  children,
  successLabel = 'Saved',
  loadingLabel = 'Saving',
  onClick,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: StatefulButtonProps) {
  const inactive = disabled || state !== 'idle';
  const label = state === 'success' ? successLabel : state === 'loading' ? loadingLabel : children;

  return (
    <>
      <m.button
        type="button"
        layout
        transition={{ layout: SPRING_SWAP }}
        whileTap={inactive ? undefined : { scale: 0.96, transition: SPRING_PRESS }}
        className={[
          'btn',
          state === 'success' ? 'btn--success' : 'btn--primary',
          'stateful-btn',
          disabled && state === 'idle' ? 'stateful-btn--disabled' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-disabled={inactive || undefined}
        aria-busy={state === 'loading' || undefined}
        aria-label={state === 'idle' ? ariaLabel : undefined}
        onClick={() => {
          if (!inactive) onClick?.();
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={state}
            className="stateful-btn__content"
            variants={SWAP_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={SPRING_SWAP}
          >
            {state === 'success' && <Check aria-hidden="true" size={18} />}
            {state === 'loading' && (
              <span className="stateful-btn__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            )}
            <span>{label}</span>
          </m.span>
        </AnimatePresence>
      </m.button>
      {/* Outside the button so its accessible name stays the visible label. */}
      <span className="visually-hidden" aria-live="polite">
        {state === 'success' ? successLabel : state === 'loading' ? loadingLabel : ''}
      </span>
    </>
  );
}
