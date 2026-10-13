import { useId, useRef, type KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import './ChipGroup.css';

export interface ChipOption<T> {
  value: T;
  label: string;
}

interface ChipGroupProps<T> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  optional?: boolean;
}

/** Single-select wrapping chips with radio semantics and roving focus (DESIGN.md §8.3). */
export function ChipGroup<T>({ label, options, value, onChange, optional = false }: ChipGroupProps<T>) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => Object.is(o.value, value)),
  );

  const move = (event: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next: number | null = null;
    if (event.key in keys) next = (index + keys[event.key] + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="chip-group">
      <div className="field__label-row">
        <span id={labelId} className="t-label chip-group__label">
          {label}
        </span>
        {optional && <span className="t-caption chip-group__optional">Optional</span>}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="chip-group__chips">
        {options.map((option, index) => {
          const selected = index === selectedIndex && Object.is(option.value, value);
          return (
            <button
              key={option.label}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={index === selectedIndex ? 0 : -1}
              className="chip"
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => move(e, index)}
            >
              {selected && <Check aria-hidden="true" size={16} strokeWidth={2.5} />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
