import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required accessible name; icons are never the only label for assistive tech. */
  label: string;
  icon: ReactNode;
  tone?: 'neutral' | 'danger';
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ label, icon, tone = 'neutral', className, type = 'button', ref, ...rest }: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={['icon-btn', `icon-btn--${tone}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
