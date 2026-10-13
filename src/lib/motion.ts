import type { Transition } from 'motion/react';

/**
 * Motion presets (DESIGN.md §11), adapted from beUI's lib/ease.ts so ported interaction
 * patterns keep their physics while visuals stay on Daybreak tokens.
 */

/** Matches --ease-emphasized. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Matches --ease-standard. */
export const EASE_STANDARD = [0.2, 0, 0, 1] as const;

/** Press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = { type: 'spring', stiffness: 500, damping: 30, mass: 0.6 } as const satisfies Transition;
/** Content swaps: labels and icons trading places inside a control. */
export const SPRING_SWAP = { type: 'spring', stiffness: 460, damping: 30, mass: 0.55 } as const satisfies Transition;
/** Shared-layout glides and size morphs (DESIGN.md's spring-soft). */
export const SPRING_LAYOUT = { type: 'spring', stiffness: 360, damping: 32, mass: 0.8 } as const satisfies Transition;
/** Panels and sheets. */
export const SPRING_PANEL = { type: 'spring', stiffness: 420, damping: 40, mass: 0.5 } as const satisfies Transition;

/** Blur-swap used when a label or icon is replaced (beUI Action Swap, blur variant). */
export const SWAP_VARIANTS = {
  initial: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
} as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
