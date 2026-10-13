import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { countWords, StreamingText, streamDuration } from './StreamingText';

function setReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: reduce && query.includes('reduce'), media: query }) as MediaQueryList,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('StreamingText', () => {
  it('wraps each word with a staggered delay while keeping the exact text', () => {
    setReducedMotion(false);
    const { container } = render(
      <p>
        <StreamingText text="Read one  short guide" startMs={100} stepMs={50} />
      </p>,
    );
    const words = container.querySelectorAll('.stream-word');
    expect([...words].map((w) => w.textContent)).toEqual(['Read', 'one', 'short', 'guide']);
    expect([...words].map((w) => (w as HTMLElement).style.animationDelay)).toEqual(['100ms', '150ms', '200ms', '250ms']);
    expect(container.textContent).toBe('Read one  short guide');
  });

  it('renders plain text under reduced motion or when inactive', () => {
    setReducedMotion(true);
    const reduced = render(<StreamingText text="Read one guide" />);
    expect(reduced.container.querySelector('.stream-word')).toBeNull();
    setReducedMotion(false);
    const inactive = render(<StreamingText text="Read one guide" active={false} />);
    expect(inactive.container.querySelector('.stream-word')).toBeNull();
  });

  it('does not change mode after mount', () => {
    setReducedMotion(false);
    const { container, rerender } = render(<StreamingText text="Read one guide" />);
    rerender(<StreamingText text="Read one guide" active={false} />);
    expect(container.querySelectorAll('.stream-word')).toHaveLength(3);
  });

  it('measures words for pacing', () => {
    expect(countWords(' When I finish  breakfast ')).toBe(4);
    expect(streamDuration('one two three', 40)).toBe(80);
    expect(streamDuration('', 40)).toBe(0);
  });
});
