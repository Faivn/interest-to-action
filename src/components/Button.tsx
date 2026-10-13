import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'ai' | 'danger-text';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Leading icon, rendered decoratively. */
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Keeps the button's width and announces progress while an action runs. */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  icon,
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, fullWidth && 'btn--full', loading && 'btn--loading', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="btn__content">
        {icon && (
          <span className="btn__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </span>
      {loading && (
        <span className="btn__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
}
