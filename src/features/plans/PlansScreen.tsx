import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { InlineMessage } from '../../components/InlineMessage';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useToast } from '../../components/Toast';
import { useDelayedFlag } from '../../lib/useDelayedFlag';
import { RollingNumber } from '../../components/RollingNumber';
import { PlanList } from './PlanList';
import { PlanListSkeleton } from './PlanListSkeleton';
import { selectCompleted, selectCurrent } from './plansReducer';
import { STATUS_LABEL, type SavedPlan } from './types';
import { usePlans } from './usePlans';
import './PlansScreen.css';

type View = 'current' | 'completed';

interface PlansScreenProps {
  onAddInterest: () => void;
  onOpenPlan: (plan: SavedPlan) => void;
  /** Highlights the plan open beside the list (expanded layout). */
  selectedId?: string | null;
  /** Rendered as the list pane of the wide-screen split view. */
  pane?: boolean;
}

/** After an undo the toast (and its focused button) disappears; land focus on the affected plan. */
function focusPlanSoon(id: string) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-plan-id="${CSS.escape(id)}"] .plan-row__check`)?.focus();
  });
}

/** docs/design.md §4.8 — the supporting "revisit and track" view. */
export function PlansScreen({ onAddInterest, onOpenPlan, selectedId = null, pane = false }: PlansScreenProps) {
  const plans = usePlans();
  const toast = useToast();
  const panelId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [view, setView] = useState<View>('current');

  const current = useMemo(() => selectCurrent(plans.plans), [plans.plans]);
  const completed = useMemo(() => selectCompleted(plans.plans), [plans.plans]);
  const visible = view === 'current' ? current : completed;
  const ready = plans.status === 'ready';
  const showSkeleton = useDelayedFlag(plans.status === 'loading', 150);
  const { setStatus } = plans;

  const handleToggleComplete = useCallback(
    (plan: SavedPlan) => {
      const previous = plan.status;
      const next = previous === 'completed' ? 'in-progress' : 'completed';
      setStatus(plan.id, next);
      toast.show({
        tone: next === 'completed' ? 'success' : 'neutral',
        message: next === 'completed' ? 'Nice work. Plan completed.' : `Moved back to ${STATUS_LABEL[next].toLowerCase()}.`,
        actionLabel: 'Undo',
        onAction: () => {
          setStatus(plan.id, previous);
          focusPlanSoon(plan.id);
        },
      });
    },
    [setStatus, toast],
  );

  // Land focus on the screen heading after navigating here (DESIGN.md §13).
  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const focusAddButton = useCallback(() => addButtonRef.current?.focus(), []);

  const isEmpty = ready && plans.plans.length === 0;

  const summary = !ready ? null : plans.plans.length === 0 ? (
    'Small steps, one at a time.'
  ) : (
    <>
      <RollingNumber value={current.length} /> current · <RollingNumber value={completed.length} /> completed
    </>
  );

  return (
    <div className={`plans-screen${pane ? ' plans-screen--pane' : ''}`}>
      <header className="plans-screen__header">
        <div>
          <h1 ref={headingRef} className="t-display plans-screen__title" tabIndex={-1}>
            My plans
          </h1>
          <p className="t-callout plans-screen__summary">{summary ?? ' '}</p>
        </div>
        {/* The empty state carries its own primary action (DESIGN.md §8.13). */}
        {!isEmpty && (
          <div className="plans-screen__add">
            <Button ref={addButtonRef} icon={<Plus />} fullWidth onClick={onAddInterest}>
              Add an interest
            </Button>
          </div>
        )}
      </header>

      {plans.saveFailed && (
        <InlineMessage
          tone="error"
          action={
            <Button variant="text" onClick={plans.retrySave}>
              Try again
            </Button>
          }
        >
          Your latest changes aren't saved on this device yet. They're still here on screen.
        </InlineMessage>
      )}

      {plans.status === 'error' ? (
        <InlineMessage
          tone="error"
          action={
            <Button variant="text" onClick={plans.reload}>
              Try again
            </Button>
          }
        >
          We couldn't load your saved plans. Nothing has been deleted.
        </InlineMessage>
      ) : isEmpty ? (
        <EmptyState
          title="No plans yet"
          action={
            <Button icon={<Plus />} onClick={onAddInterest}>
              Add an interest
            </Button>
          }
        >
          Start with one thing you've been meaning to do.
        </EmptyState>
      ) : (
        <>
          <SegmentedControl<View>
            label="Show plans"
            controls={panelId}
            value={view}
            onChange={setView}
            segments={[
              { value: 'current', label: 'Current', count: ready ? current.length : undefined },
              { value: 'completed', label: 'Completed', count: ready ? completed.length : undefined },
            ]}
          />
          <section id={panelId} className="plans-screen__panel" aria-busy={!ready || undefined}>
            {!ready ? (
              <>
                <span className="visually-hidden" role="status">
                  Loading your plans…
                </span>
                {showSkeleton && <PlanListSkeleton />}
              </>
            ) : visible.length > 0 ? (
              <PlanList
                plans={visible}
                label={view === 'current' ? 'Current plans' : 'Completed plans'}
                onToggleComplete={handleToggleComplete}
                onOpen={onOpenPlan}
                selectedId={selectedId}
                onFocusLost={focusAddButton}
              />
            ) : view === 'completed' ? (
              <EmptyState title="Nothing completed yet" ghostRows={1}>
                Plans you finish will gather here.
              </EmptyState>
            ) : (
              <EmptyState title="All clear" ghostRows={0}>
                Every plan here is complete. Add another interest when you're ready.
              </EmptyState>
            )}
          </section>
        </>
      )}
    </div>
  );
}
