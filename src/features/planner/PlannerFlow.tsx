import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useToast } from '../../components/Toast';
import { usePlans } from '../plans/usePlans';
import { sameDraft, type PlanDraft } from '../plans/types';
import {
  clearPlannerSession,
  INITIAL_PLANNER_STATE,
  loadPlannerSession,
  plannerReducer,
  savePlannerSession,
  toPlanContext,
  toPlanningInput,
  type PlannerState,
} from './plannerState';
import { CaptureStep } from './steps/CaptureStep';
import { ClarifyStep } from './steps/ClarifyStep';
import { ContextStep } from './steps/ContextStep';
import { EditPlanStep } from './steps/EditPlanStep';
import { SavedStep } from './steps/SavedStep';
import { SuggestionsStep } from './steps/SuggestionsStep';
import type { Planner, PlanSuggestion } from './types';
import { validatePlannerResult } from './validatePlannerResult';

/** Keeps keyboard focus on the card after its plan changes (the focused control re-renders or leaves). */
function focusSuggestionSoon() {
  requestAnimationFrame(() => {
    const target =
      document.querySelector<HTMLElement>('.plan-card .plan-card__dismiss') ??
      document.querySelector<HTMLElement>('.suggestions__more button');
    target?.focus();
  });
}

/** How long the recommendation card shows "Saved ✓" before the confirmation screen. */
const SAVED_CONFIRM_MS = 600;

const STEP_ORDER: Record<PlannerState['step'], number> = {
  capture: 0,
  context: 1,
  clarify: 2,
  suggestions: 3,
  edit: 4,
  saved: 5,
};

interface PlannerFlowProps {
  planner: Planner;
  navigate: (path: string) => void;
}

/**
 * The core journey: capture → context → (clarify) → suggestions → (edit) → saved.
 * Nothing is saved until the user explicitly chooses a plan.
 */
export function PlannerFlow({ planner, navigate }: PlannerFlowProps) {
  const plans = usePlans();
  const toast = useToast();
  const [state, dispatch] = useReducer(plannerReducer, undefined, () => loadPlannerSession() ?? INITIAL_PLANNER_STATE);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [promote, setPromote] = useState<{ id: string; nonce: number } | null>(null);
  const savedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(savedTimer.current), []);
  const [saveFailed, setSaveFailed] = useState(false);

  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  // A refresh mid-journey keeps the user's words (docs/product-spec.md §5.2).
  useEffect(() => savePlannerSession(state), [state]);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(
    async (regenerate: boolean, base: PlannerState = stateRef.current) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSaveFailed(false);
      dispatch({ type: 'requested', regenerate });
      try {
        const raw = await planner.suggest(toPlanningInput(base), {
          attempt: regenerate ? base.attempt + 1 : base.attempt,
          exclude: base.shownActions,
          allowClarification: base.clarification === null,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        // Invalid data is never shown as a plan (docs/design.md §4.5).
        const result = validatePlannerResult(raw);
        if (result.kind === 'clarification') dispatch({ type: 'clarificationReceived', clarification: result.clarification });
        else dispatch({ type: 'suggestionsReceived', suggestions: result.suggestions });
      } catch {
        if (!controller.signal.aborted) dispatch({ type: 'requestFailed' });
      }
    },
    [planner],
  );

  // Resume after a reload that interrupted a request.
  useEffect(() => {
    const s = stateRef.current;
    if (s.step === 'suggestions' && s.suggestions.length === 0 && s.request === 'idle') void generate(false);
  }, [generate]);

  const stopRequest = () => {
    abortRef.current?.abort();
    if (stateRef.current.request === 'loading') dispatch({ type: 'requestCancelled' });
  };

  const exit = (message: string) => {
    stopRequest();
    const snapshot = stateRef.current;
    clearPlannerSession();
    navigate('/plans');
    if (!snapshot.interest.trim()) return;
    toast.show({
      message,
      actionLabel: 'Undo',
      onAction: () => {
        savePlannerSession({ ...snapshot, request: 'idle' });
        navigate('/new');
      },
    });
  };

  /**
   * Saves only after an explicit choice. From the recommendation card the button shows a brief
   * "Saved ✓" before the confirmation screen; from Edit Plan it moves on straight away.
   */
  const save = async (suggestion: PlanSuggestion, draft: PlanDraft, { confirmMs = 0 } = {}) => {
    setSavingId(suggestion.id);
    setSaveFailed(false);
    try {
      const plan = await plans.add({
        interest: state.interest,
        context: toPlanContext(state.context),
        draft,
        rationale: suggestion.rationale,
        origin: sameDraft(draft, suggestion) ? 'suggested' : 'edited',
      });
      if (confirmMs > 0) {
        setSavedId(suggestion.id);
        savedTimer.current = window.setTimeout(() => {
          setSavedId(null);
          dispatch({ type: 'saved', plan });
        }, confirmMs);
      } else {
        dispatch({ type: 'saved', plan });
      }
    } catch {
      setSaveFailed(true);
    } finally {
      setSavingId(null);
    }
  };

  const dismiss = (suggestion: PlanSuggestion) => {
    const index = stateRef.current.suggestions.findIndex((s) => s.id === suggestion.id);
    dispatch({ type: 'suggestionDismissed', id: suggestion.id });
    focusSuggestionSoon();
    toast.show({
      message: 'Suggestion dismissed.',
      actionLabel: 'Undo',
      onAction: () => {
        dispatch({ type: 'suggestionRestored', suggestion, index });
        // Bring it back as the recommendation it was.
        setPromote({ id: suggestion.id, nonce: Date.now() });
        focusSuggestionSoon();
      },
    });
  };

  const goTo = (step: PlannerState['step']) => dispatch({ type: 'wentTo', step });

  // Forward steps push in from the right, going back pushes from the left (DESIGN.md §11.2).
  const order = STEP_ORDER[state.step];
  const previousOrder = useRef(order);
  const direction = order < previousOrder.current ? 'back' : 'forward';
  useEffect(() => {
    previousOrder.current = order;
  }, [order]);

  return (
    <div className="flow" data-direction={direction}>
      {renderStep()}
    </div>
  );

  function renderStep() {
    switch (state.step) {
      case 'capture':
        return (
          <CaptureStep
            interest={state.interest}
            onChange={(interest) => dispatch({ type: 'interestChanged', interest })}
            onContinue={() => goTo('context')}
            onClose={() => exit('Nothing was saved.')}
          />
        );

      case 'context':
        return (
          <ContextStep
            interest={state.interest}
            context={state.context}
            onChange={(context) => dispatch({ type: 'contextChanged', context })}
            onEditInterest={() => goTo('capture')}
            onBack={() => goTo('capture')}
            onSubmit={() => void generate(false)}
            onSkip={() => {
              dispatch({ type: 'contextCleared' });
              void generate(false, { ...stateRef.current, context: INITIAL_PLANNER_STATE.context });
            }}
          />
        );

      case 'clarify':
        if (!state.clarification) {
          goTo('context');
          return null;
        }
        return (
          <ClarifyStep
            interest={state.interest}
            clarification={state.clarification}
            onAnswer={(answer) => dispatch({ type: 'clarificationAnswered', answer })}
            onBack={() => goTo('context')}
            onContinue={() => void generate(false)}
            onSkip={() => {
              dispatch({ type: 'clarificationAnswered', answer: '' });
              void generate(false, { ...stateRef.current, clarification: { ...stateRef.current.clarification!, answer: '' } });
            }}
          />
        );

      case 'suggestions':
        return (
          <SuggestionsStep
            interest={state.interest}
            suggestions={state.suggestions}
            request={state.request}
            source={planner.source}
            savingId={savingId}
            savedId={savedId}
            promote={promote}
            saveFailed={saveFailed}
            onBack={() => {
              stopRequest();
              goTo('context');
            }}
            onEditDetails={() => {
              stopRequest();
              goTo('context');
            }}
            onRetry={() => void generate(false)}
            onRegenerate={() => void generate(true)}
            onSave={(s) => void save(s, s, { confirmMs: SAVED_CONFIRM_MS })}
            onEdit={(s) => {
              setSaveFailed(false);
              dispatch({ type: 'editStarted', suggestion: s });
            }}
            onDismiss={dismiss}
            onNoneOfThese={() => exit('No plan saved. That’s okay.')}
          />
        );

      case 'edit':
        if (!state.editing) {
          goTo('suggestions');
          return null;
        }
        return (
          <EditPlanStep
            interest={state.interest}
            draft={state.editing.draft}
            suggested={state.editing.suggestion}
            saving={savingId !== null}
            saveFailed={saveFailed}
            onChange={(draft) => dispatch({ type: 'draftChanged', draft })}
            onSave={() => void save(state.editing!.suggestion, state.editing!.draft)}
            onBack={() => {
              setSaveFailed(false);
              goTo('suggestions');
            }}
          />
        );

      case 'saved':
        if (!state.saved) {
          goTo('capture');
          return null;
        }
        return (
          <SavedStep
            plan={state.saved}
            onViewPlans={() => {
              clearPlannerSession();
              navigate('/plans');
            }}
            onAddAnother={() => {
              clearPlannerSession();
              dispatch({ type: 'replaced', state: INITIAL_PLANNER_STATE });
            }}
          />
        );
    }
  }
}
