import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import './InlineMessage.css';

interface InlineMessageProps {
  tone?: 'info' | 'error';
  children: ReactNode;
  /** Optional recovery action, e.g. a text Button. */
  action?: ReactNode;
}

/** Validation, errors and notes placed next to the element they concern (DESIGN.md §8.12). */
export function InlineMessage({ tone = 'info', children, action }: InlineMessageProps) {
  const Icon = tone === 'error' ? TriangleAlert : Info;
  return (
    <div className={`inline-msg inline-msg--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon className="inline-msg__icon" aria-hidden="true" size={20} />
      <div className="inline-msg__text t-callout">{children}</div>
      {action && <div className="inline-msg__action">{action}</div>}
    </div>
  );
}
