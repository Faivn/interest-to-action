import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { IconButton } from '../../../components/IconButton';
import { Screen, TopBar } from '../../../components/Screen';
import { StepIndicator } from '../../../components/StepIndicator';
import { TextField } from '../../../components/TextField';
import './steps.css';

const EXAMPLES = ['Learn UI animation', 'Start running', 'Write a short story', 'Learn Spanish'];

interface CaptureStepProps {
  interest: string;
  onChange: (interest: string) => void;
  onContinue: () => void;
  onClose: () => void;
}

/** docs/design.md §4.2 */
export function CaptureStep({ interest, onChange, onContinue, onClose }: CaptureStepProps) {
  const formId = useId();
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!interest.trim()) {
      setError('Add an interest to continue.');
      fieldRef.current?.focus();
      return;
    }
    onContinue();
  };

  return (
    <Screen
      focusHeading={false}
      topBar={
        <TopBar
          leading={<IconButton label="Close and go to my plans" icon={<X />} onClick={onClose} />}
          center={<StepIndicator current={1} total={3} />}
        />
      }
      actions={
        <Button type="submit" form={formId} fullWidth>
          Continue
        </Button>
      }
    >
      <form
        id={formId}
        className="step-form"
        noValidate
        onSubmit={submit}
        onKeyDown={(e) => {
          // Enter continues; Shift+Enter adds a line break.
          if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName === 'TEXTAREA') {
            e.preventDefault();
            submit();
          }
        }}
      >
        <TextField
          label="What's something you've been meaning to do?"
          labelClassName="t-title-1 step-question"
          value={interest}
          onChange={(value) => {
            onChange(value);
            if (error) setError(null);
          }}
          placeholder="e.g. Learn UI animation"
          helper="Anything you'd like to explore, learn, or do. A few words is enough."
          error={error}
          multiline
          minHeight={120}
          maxLength={280}
          inputRef={fieldRef}
          inside={
            interest.trim() === '' ? (
              <div className="examples" role="group" aria-label="Example interests">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="examples__chip"
                    onClick={() => {
                      onChange(example);
                      setError(null);
                      fieldRef.current?.focus();
                    }}
                  >
                    <Plus aria-hidden="true" size={14} />
                    {example}
                  </button>
                ))}
              </div>
            ) : null
          }
        />
      </form>
    </Screen>
  );
}
