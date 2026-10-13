import type { ReactNode } from 'react';
import { SparkMark } from './SparkMark';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  /** Number of dashed ghost rows that preview the shape of future content. */
  ghostRows?: number;
  action?: ReactNode;
}

/** Ghost rows + spark + short copy — shows the shape of what's coming (DESIGN.md §8.13). */
export function EmptyState({ title, children, ghostRows = 2, action }: EmptyStateProps) {
  return (
    <div className="empty">
      {ghostRows > 0 && (
        <div className="empty__ghosts" aria-hidden="true">
          {Array.from({ length: ghostRows }, (_, i) => (
            <div key={i} className="empty__ghost">
              <span className="empty__ghost-dot" />
              <span className="empty__ghost-line" />
            </div>
          ))}
        </div>
      )}
      <SparkMark size={40} className="empty__spark" />
      <h2 className="t-title-2">{title}</h2>
      {children && <p className="t-callout empty__body">{children}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
