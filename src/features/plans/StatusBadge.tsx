import { Check } from 'lucide-react';
import { STATUS_LABEL, type PlanStatus } from './types';
import './StatusBadge.css';

/** Status by icon and label as well as colour (docs/design.md §5.2). */
export function StatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span className={`status-badge status-badge--${status} t-caption`}>
      <StatusIcon status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusIcon({ status, size = 12 }: { status: PlanStatus; size?: number }) {
  if (status === 'completed') return <Check aria-hidden="true" size={size} />;
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 12" className="status-icon">
      <circle cx="6" cy="6" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {status === 'in-progress' && <path d="M6 1.25a4.75 4.75 0 0 1 0 9.5Z" fill="currentColor" />}
    </svg>
  );
}
