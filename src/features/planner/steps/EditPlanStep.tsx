import { useId, useState, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/Button';
import { IconButton } from '../../../components/IconButton';
import { InlineMessage } from '../../../components/InlineMessage';
import { Screen, TopBar } from '../../../components/Screen';
import { PlanForm } from '../../plans/PlanForm';
import { validateDraft, type DraftErrors, type PlanDraft } from '../../plans/types';
import { InterestEcho } from '../InterestEcho';
import './steps.css';

interface EditPlanStepProps {
  interest: string;
  draft: PlanDraft;
  suggested: PlanDraft;
  saving: boolean;
  saveFailed: boolean;
  onChange: (draft: PlanDraft) => void;
  onSave: () => void;
  onBack: () => void;
}

/** docs/design.md §4.6 */
export function EditPlanStep({ interest, draft, suggested, saving, saveFailed, onChange, onSave, onBack }: EditPlanStepProps) {
  const formId = useId();
  const [errors, setErrors] = useState<DraftErrors>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length === 0) onSave();
  };

  return (
    <Screen
      topBar={
        <TopBar leading={<IconButton label="Back to suggestions" icon={<ChevronLeft />} onClick={onBack} />} />
      }
      actions={
        <>
          <Button type="submit" form={formId} fullWidth loading={saving}>
            Save plan
          </Button>
          <Button variant="text" onClick={onBack} disabled={saving}>
            Back to suggestions
          </Button>
        </>
      }
    >
      <header className="step-header">
        <h1 className="t-title-2">Make it yours</h1>
        <p className="t-callout step-lede">Change anything so it fits your day. Nothing is saved until you choose to.</p>
      </header>
      <InterestEcho interest={interest} />
      {saveFailed && (
        <InlineMessage tone="error">We couldn't save your plan. Nothing has been lost, so you can try saving again.</InlineMessage>
      )}
      <form id={formId} noValidate onSubmit={submit}>
        <PlanForm
          draft={draft}
          suggested={suggested}
          errors={errors}
          onChange={(next) => {
            onChange(next);
            if (Object.keys(errors).length) setErrors(validateDraft(next));
          }}
        />
      </form>
    </Screen>
  );
}
