import { useId, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/Button';
import { ChipGroup } from '../../../components/ChipGroup';
import { IconButton } from '../../../components/IconButton';
import { Screen, TopBar } from '../../../components/Screen';
import { StepIndicator } from '../../../components/StepIndicator';
import { TextField } from '../../../components/TextField';
import { TIME_OPTIONS } from '../../plans/types';
import { InterestEcho } from '../InterestEcho';
import type { ContextFields } from '../plannerState';
import './steps.css';

interface ContextStepProps {
  interest: string;
  context: ContextFields;
  onChange: (context: Partial<ContextFields>) => void;
  onEditInterest: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}

/** docs/design.md §4.3 — every field optional; the screen should not feel like a form. */
export function ContextStep({ interest, context, onChange, onEditInterest, onBack, onSubmit, onSkip }: ContextStepProps) {
  const formId = useId();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  const hasAny = context.outcome.trim() !== '' || context.obstacle.trim() !== '' || context.timeMinutes !== null;

  return (
    <Screen
      topBar={
        <TopBar
          leading={<IconButton label="Back to your interest" icon={<ChevronLeft />} onClick={onBack} />}
          center={<StepIndicator current={2} total={3} />}
        />
      }
      actions={
        <>
          <Button type="submit" form={formId} fullWidth>
            Suggest next steps
          </Button>
          {!hasAny && (
            <Button variant="text" onClick={onSkip}>
              Skip
            </Button>
          )}
        </>
      }
    >
      <InterestEcho interest={interest} onEdit={onEditInterest} />
      <header className="step-header">
        <h1 className="t-title-2">A little context helps</h1>
        <p className="t-callout step-lede">All optional. Share only what you'd like the suggestions to consider.</p>
      </header>
      <form id={formId} className="step-form" noValidate onSubmit={submit}>
        <TextField
          label="What would success look like?"
          optional
          value={context.outcome}
          onChange={(outcome) => onChange({ outcome })}
          placeholder="e.g. Animate a project in my portfolio"
          multiline
          minHeight={72}
          maxLength={160}
        />
        <TextField
          label="What's stopping you from starting?"
          optional
          value={context.obstacle}
          onChange={(obstacle) => onChange({ obstacle })}
          placeholder="e.g. I don't know where to begin"
          multiline
          minHeight={72}
          maxLength={160}
        />
        <ChipGroup
          label="How much time can you give it?"
          optional
          options={TIME_OPTIONS}
          value={context.timeMinutes}
          onChange={(timeMinutes) => onChange({ timeMinutes })}
        />
      </form>
    </Screen>
  );
}
