import { useLayoutEffect, useRef } from 'react';
import { PlanRow } from './PlanRow';
import type { SavedPlan } from './types';
import './PlanList.css';

interface PlanListProps {
  plans: SavedPlan[];
  label: string;
  onToggleComplete: (plan: SavedPlan) => void;
  onOpen: (plan: SavedPlan) => void;
  selectedId?: string | null;
  /** Called when the list loses its last item while focus was inside it. */
  onFocusLost?: () => void;
}

export function PlanList({ plans, label, onToggleComplete, onOpen, selectedId = null, onFocusLost }: PlanListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const lastFocusedIndex = useRef<number | null>(null);

  // When a focused row leaves (e.g. moved to Completed), keep keyboard users in place
  // by moving focus to the row that took its position.
  useLayoutEffect(() => {
    const list = listRef.current;
    const index = lastFocusedIndex.current;
    if (index === null) return;
    const active = document.activeElement;
    if (active && active !== document.body && document.contains(active)) return;
    lastFocusedIndex.current = null;
    const rows = list?.querySelectorAll<HTMLLIElement>(':scope > li') ?? [];
    const row = rows[Math.min(index, rows.length - 1)];
    const target = row?.querySelector<HTMLElement>('.plan-row__check');
    if (target) target.focus();
    else onFocusLost?.();
  }, [plans, onFocusLost]);

  return (
    <ul
      ref={listRef}
      className="plan-list"
      aria-label={label}
      onFocus={(event) => {
        const row = (event.target as HTMLElement).closest('li');
        if (!row || !listRef.current) return;
        lastFocusedIndex.current = Array.prototype.indexOf.call(listRef.current.children, row);
      }}
      onBlur={(event) => {
        // Focus moved somewhere else on purpose; stop tracking. (A removed row blurs with no relatedTarget.)
        const next = event.relatedTarget as Node | null;
        if (next && !listRef.current?.contains(next)) lastFocusedIndex.current = null;
      }}
    >
      {plans.map((plan, index) => (
        <PlanRow
          key={plan.id}
          plan={plan}
          index={index}
          selected={plan.id === selectedId}
          onToggleComplete={onToggleComplete}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );
}
