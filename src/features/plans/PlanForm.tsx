import { useId } from 'react';
import { ChipGroup } from '../../components/ChipGroup';
import { NumberStepper } from '../../components/NumberStepper';
import { ProvenanceTag } from '../../components/ProvenanceTag';
import { TextField } from '../../components/TextField';
import { PlanSentence } from './PlanSentence';
import { MAX_DURATION_MINUTES, type DraftErrors, type PlanDraft } from './types';
import './PlanForm.css';

interface PlanFormProps {
  draft: PlanDraft;
  onChange: (draft: PlanDraft) => void;
  errors: DraftErrors;
  /** The planner's original values; when given, each field shows whether it is still the suggestion. */
  suggested?: PlanDraft;
}

const QUICK_MINUTES = [5, 10, 15, 20, 30].map((m) => ({ value: m as number | null, label: `${m} min` }));

const same = (a: string, b: string) => a.trim().replace(/\s+/g, ' ') === b.trim().replace(/\s+/g, ' ');

/** When / I'll / For fields with a live If–Then preview (docs/design.md §4.6). */
export function PlanForm({ draft, onChange, errors, suggested }: PlanFormProps) {
  const previewLabelId = useId();
  const tag = (unchanged: boolean) => (suggested ? <ProvenanceTag origin={unchanged ? 'suggested' : 'edited'} /> : undefined);

  return (
    <div className="plan-form">
      <TextField
        label="When"
        value={draft.trigger}
        onChange={(trigger) => onChange({ ...draft, trigger })}
        placeholder="e.g. I finish breakfast"
        helper="A moment that already happens in your day works best."
        error={errors.trigger}
        maxLength={160}
        accessory={tag(!!suggested && same(draft.trigger, suggested.trigger))}
      />
      <TextField
        label="I'll"
        value={draft.action}
        onChange={(action) => onChange({ ...draft, action })}
        placeholder="e.g. Watch the first lesson of a beginner course"
        error={errors.action}
        multiline
        minHeight={80}
        maxLength={200}
        accessory={tag(!!suggested && same(draft.action, suggested.action))}
      />
      <NumberStepper
        label="For"
        unit="minutes"
        value={draft.durationMinutes}
        onChange={(durationMinutes) => onChange({ ...draft, durationMinutes })}
        min={1}
        max={MAX_DURATION_MINUTES}
        error={errors.durationMinutes}
        accessory={tag(!!suggested && draft.durationMinutes === suggested.durationMinutes)}
      />
      {/* Quick picks beside the stepper (DESIGN.md §9, Edit Plan). */}
      <div className="plan-form__quick">
        <ChipGroup<number | null>
          label="Common lengths"
          hideLabel
          options={QUICK_MINUTES}
          value={QUICK_MINUTES.some((o) => o.value === draft.durationMinutes) ? draft.durationMinutes : null}
          onChange={(minutes) => minutes !== null && onChange({ ...draft, durationMinutes: minutes })}
        />
      </div>
      <section className="plan-form__preview" aria-labelledby={previewLabelId}>
        <p id={previewLabelId} className="t-overline plan-form__preview-label">
          Your plan
        </p>
        <PlanSentence plan={draft} className="t-plan-action" />
      </section>
    </div>
  );
}
