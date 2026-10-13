import { useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';
import './StreamingText.css';

/** Default pacing for a calm, word-by-word reveal. */
export const STREAM_STEP_MS = 45;

const WORD_OR_SPACE = /(\s+)/;

export function countWords(text: string): number {
  return text.split(WORD_OR_SPACE).filter((part) => part.trim() !== '').length;
}

/** Milliseconds until the last word of `text` starts appearing. */
export function streamDuration(text: string, stepMs = STREAM_STEP_MS): number {
  return Math.max(0, countWords(text) - 1) * stepMs;
}

interface StreamingTextProps {
  text: string;
  /** When the first word starts, relative to mount. */
  startMs?: number;
  stepMs?: number;
  /** Set false to render plain text (e.g. content the user has already seen). */
  active?: boolean;
}

/**
 * Presents finished text as if it were being written: each word fades in from soft to sharp.
 * Words keep their space from the first frame, so nothing reflows, and the real text is in the
 * DOM from the start, so screen readers and copy/paste get it immediately. Plain text under
 * reduced motion (DESIGN.md §11.3).
 */
export function StreamingText({ text, startMs = 0, stepMs = STREAM_STEP_MS, active = true }: StreamingTextProps) {
  // Decide once per mount, so a later re-render never cuts an animation short.
  const [animate] = useState(() => active && !prefersReducedMotion());
  if (!animate) return <>{text}</>;

  let index = 0;
  return (
    <>
      {text.split(WORD_OR_SPACE).map((part, key) =>
        part.trim() === '' ? (
          part
        ) : (
          <span key={key} className="stream-word" style={{ animationDelay: `${startMs + index++ * stepMs}ms` }}>
            {part}
          </span>
        ),
      )}
    </>
  );
}
