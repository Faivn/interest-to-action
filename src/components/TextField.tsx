import { useId, useLayoutEffect, useRef, type ChangeEvent, type ReactNode, type Ref } from 'react';
import { TriangleAlert } from 'lucide-react';
import './TextField.css';

interface TextFieldProps {
  label: string;
  /** Override the label style, e.g. a serif question as the field's visible label. */
  labelClassName?: string;
  /** Rendered at the end of the label row, e.g. a provenance tag. Replaces "Optional". */
  accessory?: ReactNode;
  /**
   * Rendered inside the field box, below the text (e.g. suggestion chips). Pass `null` to keep the
   * box (and the textarea element) stable while the content is hidden.
   */
  inside?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  /** Shows "Optional" beside the label so optionality is visible without asterisks. */
  optional?: boolean;
  placeholder?: string;
  helper?: string;
  error?: string | null;
  multiline?: boolean;
  /** Minimum height in px for multiline fields; grows with content up to `maxRows`-ish 240px. */
  minHeight?: number;
  maxLength?: number;
  autoFocus?: boolean;
  name?: string;
  enterKeyHint?: 'done' | 'next' | 'enter';
  inputRef?: Ref<HTMLInputElement & HTMLTextAreaElement>;
}

const MAX_AUTO_HEIGHT = 240;

export function TextField({
  label,
  labelClassName = 't-label',
  accessory,
  inside,
  value,
  onChange,
  optional = false,
  placeholder,
  helper,
  error,
  multiline = false,
  minHeight = 72,
  maxLength,
  autoFocus,
  name,
  enterKeyHint,
  inputRef,
}: TextFieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!multiline || !el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), MAX_AUTO_HEIGHT)}px`;
  }, [value, multiline, minHeight]);

  const describedBy = [helper && helperId, error && errorId].filter(Boolean).join(' ') || undefined;
  const shared = {
    id,
    name,
    value,
    placeholder,
    maxLength,
    autoFocus,
    enterKeyHint,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: 'field__control',
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  const setRefs = (el: (HTMLInputElement & HTMLTextAreaElement) | null) => {
    areaRef.current = el;
    if (typeof inputRef === 'function') inputRef(el);
    else if (inputRef) inputRef.current = el;
  };

  return (
    <div className={['field', error && 'field--error'].filter(Boolean).join(' ')}>
      <div className="field__label-row">
        <label htmlFor={id} className={`field__label ${labelClassName}`}>
          {label}
        </label>
        {accessory ?? (optional && <span className="field__optional t-caption">Optional</span>)}
      </div>
      {inside !== undefined ? (
        <div className="field__box">
          <textarea {...shared} ref={setRefs} rows={1} style={{ minHeight }} />
          {inside && <div className="field__inside">{inside}</div>}
        </div>
      ) : multiline ? (
        <textarea {...shared} ref={setRefs} rows={1} style={{ minHeight }} />
      ) : (
        <input {...shared} ref={setRefs} type="text" autoComplete="off" />
      )}
      {helper && !error && (
        <p id={helperId} className="field__helper t-caption">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error t-caption" role="alert">
          <TriangleAlert aria-hidden="true" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
