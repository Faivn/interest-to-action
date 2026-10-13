import { useRef, useState } from 'react';
import { ChevronLeft, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { IconButton } from '../../components/IconButton';
import { MenuPopover } from '../../components/MenuPopover';
import { ProvenanceTag } from '../../components/ProvenanceTag';
import { Screen, TopBar } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { formatRelativeDay } from '../../lib/dates';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { PlanForm } from './PlanForm';
import { PlanSentence } from './PlanSentence';
import { StatusIcon } from './StatusBadge';
import { draftFromPlan, PLAN_STATUSES, STATUS_LABEL, validateDraft, type DraftErrors, type PlanDraft, type PlanStatus } from './types';
import { usePlans } from './usePlans';
import './PlanDetailScreen.css';

interface PlanDetailScreenProps {
  planId: string;
  onBack: () => void;
  /** Shown beside the list on wide screens: no back button, no full-screen frame. */
  embedded?: boolean;
}

/** docs/design.md §4.9 — revisit, track progress, edit, or delete a saved plan. */
export function PlanDetailScreen({ planId, onBack, embedded = false }: PlanDetailScreenProps) {
  const plans = usePlans();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  // The top bar is built before the handlers below, so it calls them through refs.
  const openEditorRef = useRef(() => {});
  const removeRef = useRef(() => {});
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const popoverMenu = useMediaQuery('(min-width: 600px)');
  const [editing, setEditing] = useState<PlanDraft | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  
  const plan = plans.plans.find((p) => p.id === planId);
  const topBar = (
    <TopBar
      leading={embedded ? undefined : <IconButton label="Back to my plans" icon={<ChevronLeft />} onClick={onBack} />}
      trailing={
        plan ? (
          <span className="plan-detail__menu-anchor">
            <IconButton
              ref={menuButtonRef}
              label="Plan options"
              icon={<Ellipsis />}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            />
            {popoverMenu && (
              <MenuPopover
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                label="Plan options"
                anchorRef={menuButtonRef}
                items={[
                  { label: 'Edit plan', icon: <Pencil size={18} />, onSelect: () => openEditorRef.current() },
                  { label: 'Delete plan', icon: <Trash2 size={18} />, tone: 'danger', onSelect: () => removeRef.current() },
                ]}
              />
            )}
          </span>
        ) : undefined
      }
    />
  );

  if (plans.status === 'loading') {
    return (
      <Screen topBar={topBar} focusHeading={false}>
        <p className="visually-hidden" role="status">
          Loading your plan…
        </p>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen topBar={topBar}>
        <EmptyState
          title="We couldn't find that plan"
          ghostRows={0}
          action={<Button onClick={onBack}>View my plans</Button>}
        >
          It may have been deleted, or the link is out of date.
        </EmptyState>
      </Screen>
    );
  }

  const changeStatus = (next: PlanStatus) => {
    if (next === plan.status) return;
    const previous = plan.status;
    plans.setStatus(plan.id, next);
    toast.show({
      tone: next === 'completed' ? 'success' : 'neutral',
      message: next === 'completed' ? 'Nice work. Plan completed.' : `Marked ${STATUS_LABEL[next].toLowerCase()}.`,
      actionLabel: 'Undo',
      onAction: () => plans.setStatus(plan.id, previous),
    });
  };

  const remove = () => {
    const removed = plans.remove(plan.id);
    onBack();
    if (removed) {
      toast.show({ message: 'Plan deleted.', actionLabel: 'Undo', onAction: () => plans.restore(removed) });
    }
  };

  const saveEdit = () => {
    if (!editing) return;
    const found = validateDraft(editing);
    setErrors(found);
    if (Object.keys(found).length) return;
    plans.edit(plan.id, editing);
    setEditing(null);
    toast.show({ tone: 'success', message: 'Plan updated.' });
  };

  const { outcome, obstacle, timeMinutes } = plan.context;
  const hasContext = outcome || obstacle || timeMinutes;
  const day = (iso: string) => formatRelativeDay(iso).replace(/^(Today|Yesterday)$/, (d) => d.toLowerCase());

  const openEditor = () => {
    setMenuOpen(false);
    setEditing(draftFromPlan(plan));
  };
  openEditorRef.current = openEditor;
  removeRef.current = remove;

  return (
    <Screen topBar={topBar} className={embedded ? 'screen--embedded' : undefined}>
      <header className="plan-detail__header">
        <p className="t-overline plan-detail__label">Your interest</p>
        <p className="t-interest plan-detail__interest">{plan.interest}</p>
      </header>

      <section className="plan-detail__plan" aria-label="Your plan">
        <div className="plan-detail__plan-head">
          <span className="t-overline plan-detail__label">Your plan</span>
          <ProvenanceTag origin={plan.origin} />
        </div>
        <PlanSentence plan={plan} as="h1" className="t-title-2" />
        {plan.rationale && <p className="t-callout plan-detail__why">{plan.rationale}</p>}
        <Button variant="secondary" icon={<Pencil />} onClick={openEditor}>
          Edit plan
        </Button>
      </section>

      {hasContext && (
        <section className="plan-detail__section" aria-labelledby="plan-context-label">
          <h2 id="plan-context-label" className="t-overline plan-detail__label">
            What you shared
          </h2>
          <dl className="plan-detail__context">
            {outcome && (
              <div>
                <dt className="t-caption">Success would look like</dt>
                <dd className="t-callout">{outcome}</dd>
              </div>
            )}
            {obstacle && (
              <div>
                <dt className="t-caption">What was in the way</dt>
                <dd className="t-callout">{obstacle}</dd>
              </div>
            )}
            {timeMinutes && (
              <div>
                <dt className="t-caption">Time available</dt>
                <dd className="t-callout">{timeMinutes === 30 ? '30+ minutes' : `${timeMinutes} minutes`}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="plan-detail__section" aria-labelledby="plan-progress-label">
        <h2 id="plan-progress-label" className="t-overline plan-detail__label">
          Progress
        </h2>
        <SegmentedControl<PlanStatus>
          label="Progress"
          value={plan.status}
          onChange={changeStatus}
          segments={PLAN_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], icon: <StatusIcon status={s} size={14} /> }))}
        />
      </section>

      <p className="t-caption plan-detail__dates">
        Saved {day(plan.createdAt)}
        {plan.updatedAt !== plan.createdAt && ` · Updated ${day(plan.updatedAt)}`}
      </p>

      <Sheet open={menuOpen && !popoverMenu} onClose={() => setMenuOpen(false)} title="Plan options">
        <div className="plan-detail__menu">
          <Button variant="secondary" icon={<Pencil />} onClick={openEditor}>
            Edit plan
          </Button>
          <Button
            variant="danger-text"
            icon={<Trash2 />}
            onClick={() => {
              setMenuOpen(false);
              remove();
            }}
          >
            Delete plan
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setErrors({});
        }}
        title="Edit plan"
        footer={
          <>
            <Button onClick={saveEdit}>Save changes</Button>
            <Button
              variant="text"
              onClick={() => {
                setEditing(null);
                setErrors({});
              }}
            >
              Cancel
            </Button>
          </>
        }
      >
        {editing && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
          >
            <PlanForm
              draft={editing}
              errors={errors}
              onChange={(next) => {
                setEditing(next);
                if (Object.keys(errors).length) setErrors(validateDraft(next));
              }}
            />
          </form>
        )}
      </Sheet>
    </Screen>
  );
}
