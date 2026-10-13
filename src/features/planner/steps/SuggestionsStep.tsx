import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { IconButton } from '../../../components/IconButton';
import { InlineMessage } from '../../../components/InlineMessage';
import { Screen, TopBar } from '../../../components/Screen';
import { SparkMark } from '../../../components/SparkMark';
import { StepIndicator } from '../../../components/StepIndicator';
import { prefersReducedMotion } from '../../../lib/motion';
import { InterestEcho } from '../InterestEcho';
import { PlanCard } from '../PlanCard';
import { PlanCardSkeleton } from '../PlanCardSkeleton';
import type { Planner, PlanSuggestion } from '../types';
import './steps.css';

interface SuggestionsStepProps {
  interest: string;
  suggestions: PlanSuggestion[];
  request: 'idle' | 'loading' | 'error';
  source: Planner['source'];
  savingId: string | null;
  saveFailed: boolean;
  onBack: () => void;
  onEditDetails: () => void;
  onRetry: () => void;
  onRegenerate: () => void;
  onSave: (suggestion: PlanSuggestion) => void;
  onEdit: (suggestion: PlanSuggestion) => void;
  onDismiss: (suggestion: PlanSuggestion) => void;
  onNoneOfThese: () => void;
}

/** Plays the "chosen" moment before saving (DESIGN.md §11.2). */
const CHOOSE_DELAY_MS = 280;

/** docs/design.md §4.5 */
export function SuggestionsStep(props: SuggestionsStepProps) {
  const { interest, suggestions, request, source, savingId, saveFailed } = props;
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (saveFailed) setChoosingId(null);
  }, [saveFailed]);

  const loading = request === 'loading';
  const firstLoad = loading && suggestions.length === 0;
  const regenerating = loading && suggestions.length > 0;
  const activeId = choosingId ?? savingId;

  const choose = (suggestion: PlanSuggestion) => {
    if (activeId) return;
    setChoosingId(suggestion.id);
    timer.current = window.setTimeout(() => props.onSave(suggestion), prefersReducedMotion() ? 0 : CHOOSE_DELAY_MS);
  };

  return (
    <Screen
      wash
      topBar={
        <TopBar
          leading={<IconButton label="Back to context" icon={<ChevronLeft />} onClick={props.onBack} />}
          center={<StepIndicator current={3} total={3} />}
        />
      }
    >
      <header className="step-header">
        <h1 className="t-title-1">Here are a few ways to start</h1>
        <p className="t-callout step-lede">Pick one to save, change it to fit your day, or dismiss what doesn't suit you.</p>
      </header>
      <InterestEcho interest={interest} onEdit={props.onEditDetails} />

      {saveFailed && (
        <InlineMessage tone="error">We couldn't save your plan. Nothing has been lost, so you can try saving again.</InlineMessage>
      )}

      {request === 'error' ? (
        <InlineMessage
          tone="error"
          action={
            <div className="inline-actions">
              <Button variant="text" onClick={props.onRetry}>
                Try again
              </Button>
              <Button variant="text" onClick={props.onEditDetails}>
                Edit details
              </Button>
            </div>
          }
        >
          We couldn't get suggestions right now. Your interest is saved on this screen.
        </InlineMessage>
      ) : firstLoad ? (
        <GeneratingState />
      ) : suggestions.length === 0 ? (
        <EmptyState title="No suggestions left" ghostRows={0}>
          Try different ideas, adjust your details, or leave without saving.
        </EmptyState>
      ) : (
        <section
          className={`suggestions${regenerating ? ' suggestions--regenerating' : ''}`}
          aria-label="Suggested plans"
          aria-busy={regenerating || undefined}
        >
          {regenerating && (
            <span className="visually-hidden" role="status">
              Finding different ideas…
            </span>
          )}
          {suggestions.map((suggestion, index) => (
            <PlanCard
              key={suggestion.id}
              suggestion={suggestion}
              position={index + 1}
              total={suggestions.length}
              state={activeId ? (activeId === suggestion.id ? 'chosen' : 'muted') : 'default'}
              busy={loading || activeId !== null}
              onSave={() => choose(suggestion)}
              onEdit={() => props.onEdit(suggestion)}
              onDismiss={() => props.onDismiss(suggestion)}
            />
          ))}
        </section>
      )}

      {request !== 'error' && !firstLoad && (
        <div className="suggestions__more">
          <Button
            variant="ai"
            icon={<SparkMark size={18} />}
            loading={regenerating}
            disabled={loading || activeId !== null}
            onClick={props.onRegenerate}
          >
            Show different ideas
          </Button>
          <Button variant="text" onClick={props.onNoneOfThese} disabled={activeId !== null}>
            None of these
          </Button>
        </div>
      )}

      <InlineMessage>
        {source === 'demo'
          ? "These suggestions come from a built-in demo planner, not a live AI model. They're starting points: save, edit, or dismiss any of them."
          : 'Suggestions are generated by AI and can be wrong. Save, edit, or dismiss any of them.'}
      </InlineMessage>
    </Screen>
  );
}

function GeneratingState() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <section className="generating" aria-busy="true" aria-label="Suggested plans">
      <p className="generating__caption t-callout" role="status">
        <SparkMark size={16} className="generating__spark" />
        {slow ? 'Still working on it. Thanks for waiting.' : 'Finding a few small ways to start…'}
      </p>
      {[0, 1, 2].map((i) => (
        <PlanCardSkeleton key={i} index={i} />
      ))}
    </section>
  );
}
