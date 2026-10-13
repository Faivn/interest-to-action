import { useId, useState, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/Button';
import { ChipGroup } from '../../../components/ChipGroup';
import { IconButton } from '../../../components/IconButton';
import { Screen, TopBar } from '../../../components/Screen';
import { SparkMark } from '../../../components/SparkMark';
import { StepIndicator } from '../../../components/StepIndicator';
import { TextField } from '../../../components/TextField';
import { InterestEcho } from '../InterestEcho';
import type { ClarificationRequest } from '../types';
import './steps.css';

interface ClarifyStepProps {
  interest: string;
  clarification: ClarificationRequest & { answer: string };
  onAnswer: (answer: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
}

/** docs/design.md §4.4 — one focused question, never presented as an error. */
export function ClarifyStep({ interest, clarification, onAnswer, onBack, onContinue, onSkip }: ClarifyStepProps) {
  const formId = useId();
  const [error, setError] = useState<string | null>(null);
  const { question, options, answer } = clarification;
  const chosenOption = options.includes(answer) ? answer : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) {
      setError(options.length ? 'Choose an option or type a short answer.' : 'Type a short answer to continue.');
      return;
    }
    onContinue();
  };

  return (
    <Screen
      topBar={
        <TopBar
          leading={<IconButton label="Back to context" icon={<ChevronLeft />} onClick={onBack} />}
          center={<StepIndicator current={2} total={3} />}
        />
      }
      actions={
        <>
          <Button type="submit" form={formId} fullWidth>
            Continue
          </Button>
          <Button variant="text" onClick={onSkip}>
            Skip and suggest anyway
          </Button>
        </>
      }
    >
      <InterestEcho interest={interest} />
      <header className="step-header step-header--ai">
        <SparkMark size={28} />
        <p className="t-overline step-kicker">One quick question</p>
        <h1 className="t-title-2">{question}</h1>
        <p className="t-callout step-lede">It helps make the suggestions specific to you.</p>
      </header>
      <form id={formId} className="step-form" noValidate onSubmit={submit}>
        {options.length > 0 && (
          <ChipGroup<string | null>
            label="Pick one"
            options={options.map((o) => ({ value: o, label: o }))}
            value={chosenOption}
            onChange={(value) => {
              onAnswer(value ?? '');
              setError(null);
            }}
          />
        )}
        <TextField
          label={options.length ? 'Or in your own words' : 'Your answer'}
          value={chosenOption ? '' : answer}
          onChange={(value) => {
            onAnswer(value);
            setError(null);
          }}
          placeholder="e.g. Simple website animations"
          error={error}
          maxLength={160}
        />
      </form>
    </Screen>
  );
}
