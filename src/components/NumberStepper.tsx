import { useEffect, useId, useState, type ReactNode } from 'react';
import { Minus, Plus, TriangleAlert } from 'lucide-react';
import './NumberStepper.css';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string | null;
  accessory?: ReactNode;
}

/** Numeric input with − / + buttons. Emits NaN while the field is empty so validation can explain it. */
export function NumberStepper({ label, value, onChange, unit, min = 1, max = 999, step = 5, error, accessory }: NumberStepperProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const unitId = `${id}-unit`;
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : '');

  // Follow external changes (the − / + buttons) without overwriting what the user is typing.
  useEffect(() => {
    if (Number(text) !== value && !(text === '' && Number.isNaN(value))) setText(Number.isFinite(value) ? String(value) : '');
  }, [value]);

  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  const nudge = (direction: 1 | -1) => {
    const base = Number.isFinite(value) ? value : 0;
    // Snap to the step grid: 12 → 15 (+) or 10 (−).
    const next = direction === 1 ? Math.floor(base / step) * step + step : Math.ceil(base / step) * step - step;
    set(next);
  };

  return (
    <div className={['field', error && 'field--error'].filter(Boolean).join(' ')}>
      <div className="field__label-row">
        <label htmlFor={id} className="field__label t-label">
          {label}
        </label>
        {accessory}
      </div>
      <div className="stepper">
        <button
          type="button"
          className="stepper__btn"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => nudge(-1)}
          disabled={Number.isFinite(value) && value <= min}
        >
          <Minus aria-hidden="true" size={20} />
        </button>
        <div className="stepper__input-wrap">
          <input
            id={id}
            className="field__control stepper__input"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={[unitId, error && errorId].filter(Boolean).join(' ')}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
              setText(digits);
              onChange(digits === '' ? Number.NaN : Number(digits));
            }}
          />
          <span id={unitId} className="stepper__unit t-callout">
            {unit}
          </span>
        </div>
        <button
          type="button"
          className="stepper__btn"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => nudge(1)}
          disabled={Number.isFinite(value) && value >= max}
        >
          <Plus aria-hidden="true" size={20} />
        </button>
      </div>
      {error && (
        <p id={errorId} className="field__error t-caption" role="alert">
          <TriangleAlert aria-hidden="true" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
