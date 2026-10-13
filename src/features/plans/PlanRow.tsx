import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatRelativeDay } from '../../lib/dates';
import { prefersReducedMotion } from '../../lib/motion';
import { StatusBadge } from './StatusBadge';
import { formatPlanSentence, type SavedPlan } from './types';
import './PlanRow.css';

interface PlanRowProps {
  plan: SavedPlan;
  index: number;
  selected?: boolean;
  onToggleComplete: (plan: SavedPlan) => void;
  onOpen: (plan: SavedPlan) => void;
}

/** Lets the check draw and sparkle play before a plan moves to Completed. */
const COMPLETE_DELAY_MS = 420;

/** A saved plan in My Plans (DESIGN.md §8.10). No overdue states, ever. */
export function PlanRow({ plan, index, selected = false, onToggleComplete, onOpen }: PlanRowProps) {
  const [completing, setCompleting] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const done = plan.status === 'completed' || completing;
  const sentence = formatPlanSentence(plan);
  const date =
    plan.status === 'completed' && plan.completedAt
      ? `Completed ${formatRelativeDay(plan.completedAt).replace(/^(Today|Yesterday)$/, (d) => d.toLowerCase())}`
      : `Saved ${formatRelativeDay(plan.createdAt).replace(/^(Today|Yesterday)$/, (d) => d.toLowerCase())}`;

  const toggle = () => {
    if (completing) return;
    if (plan.status === 'completed' || prefersReducedMotion()) {
      onToggleComplete(plan);
      return;
    }
    setCompleting(true);
    timer.current = window.setTimeout(() => onToggleComplete(plan), COMPLETE_DELAY_MS);
  };

  return (
    <li
      className={['plan-row', done && 'plan-row--done', completing && 'plan-row--completing', selected && 'plan-row--selected']
        .filter(Boolean)
        .join(' ')}
      style={{ '--i': Math.min(index, 8) } as CSSProperties}
      data-plan-id={plan.id}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Completed: ${plan.interest}`}
        className="plan-row__check"
        onClick={toggle}
      >
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <circle className="plan-row__check-ring" cx="14" cy="14" r="12" />
          <path className="plan-row__check-mark" d="M8.5 14.5l3.8 3.8 7.4-8" pathLength={1} />
        </svg>
        <span className="plan-row__burst" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} style={{ '--n': i } as CSSProperties} />
          ))}
        </span>
      </button>

      <button type="button" className="plan-row__main" aria-current={selected ? 'true' : undefined} onClick={() => onOpen(plan)}>
        <span className="plan-row__text">
          <span className="plan-row__interest t-interest">{plan.interest}</span>
          <span className="plan-row__sentence t-body-strong">{sentence}</span>
          <span className="plan-row__meta t-caption">
            <StatusBadge status={completing ? 'completed' : plan.status} />
            <span aria-hidden="true">·</span>
            <span>{date}</span>
          </span>
        </span>
        <ChevronRight className="plan-row__chevron" aria-hidden="true" size={20} />
      </button>
    </li>
  );
}
