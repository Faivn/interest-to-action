import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import './SegmentedControl.css';

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Optional count shown after the label, e.g. "Active 3". */
  count?: number;
  /** Optional decorative icon before the label. */
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** id of the element whose content this control switches. */
  controls?: string;
}

/** Pill segmented control (DESIGN.md §8.9) with radio semantics and arrow-key support. */
export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
  controls,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    segments.findIndex((s) => s.value === value),
  );

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + segments.length) % segments.length;
    onChange(segments[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`segmented${segments.length > 2 ? ' segmented--compact' : ''}`}
      style={{ '--segments': segments.length, '--active': activeIndex } as CSSProperties}
    >
      <span className="segmented__thumb" aria-hidden="true" />
      {segments.map((segment, index) => (
        <button
          key={segment.value}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="button"
          role="radio"
          aria-checked={index === activeIndex}
          aria-controls={controls}
          tabIndex={index === activeIndex ? 0 : -1}
          className="segmented__option"
          onClick={() => onChange(segment.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
        >
          {segment.icon}
          {segment.label}
          {segment.count !== undefined && <span className="segmented__count">{segment.count}</span>}
        </button>
      ))}
    </div>
  );
}
