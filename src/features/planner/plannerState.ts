import type { PlanContext, PlanDraft, SavedPlan } from '../plans/types';
import type { ClarificationRequest, PlanningInput, PlanSuggestion } from './types';

export type PlannerStep = 'capture' | 'context' | 'clarify' | 'suggestions' | 'edit' | 'saved';

export interface ContextFields {
  outcome: string;
  obstacle: string;
  timeMinutes: number | null;
}

export interface PlannerState {
  step: PlannerStep;
  interest: string;
  context: ContextFields;
  clarification: (ClarificationRequest & { answer: string }) | null;
  request: 'idle' | 'loading' | 'error';
  suggestions: PlanSuggestion[];
  /** Every action shown so far, so "Show different ideas" avoids repeats. */
  shownActions: string[];
  attempt: number;
  editing: { suggestion: PlanSuggestion; draft: PlanDraft } | null;
  saved: SavedPlan | null;
}

export const INITIAL_PLANNER_STATE: PlannerState = {
  step: 'capture',
  interest: '',
  context: { outcome: '', obstacle: '', timeMinutes: null },
  clarification: null,
  request: 'idle',
  suggestions: [],
  shownActions: [],
  attempt: 0,
  editing: null,
  saved: null,
};

export type PlannerAction =
  | { type: 'interestChanged'; interest: string }
  | { type: 'contextChanged'; context: Partial<ContextFields> }
  | { type: 'contextCleared' }
  | { type: 'wentTo'; step: PlannerStep }
  | { type: 'requested'; regenerate: boolean }
  | { type: 'suggestionsReceived'; suggestions: PlanSuggestion[] }
  | { type: 'clarificationReceived'; clarification: ClarificationRequest }
  | { type: 'clarificationAnswered'; answer: string }
  | { type: 'requestFailed' }
  | { type: 'requestCancelled' }
  | { type: 'suggestionDismissed'; id: string }
  | { type: 'suggestionRestored'; suggestion: PlanSuggestion; index: number }
  | { type: 'editStarted'; suggestion: PlanSuggestion }
  | { type: 'draftChanged'; draft: PlanDraft }
  | { type: 'saved'; plan: SavedPlan }
  | { type: 'replaced'; state: PlannerState };

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'interestChanged':
      // A different interest means earlier suggestions and clarifications no longer apply.
      return action.interest.trim() === state.interest.trim()
        ? { ...state, interest: action.interest }
        : { ...state, interest: action.interest, clarification: null, suggestions: [], shownActions: [], attempt: 0 };
    case 'contextChanged':
      return { ...state, context: { ...state.context, ...action.context } };
    case 'contextCleared':
      return { ...state, context: INITIAL_PLANNER_STATE.context };
    case 'wentTo':
      return { ...state, step: action.step };
    case 'requested':
      return {
        ...state,
        step: 'suggestions',
        request: 'loading',
        attempt: action.regenerate ? state.attempt + 1 : state.attempt,
        // Fresh (non-regenerate) requests start from an empty list; regenerating keeps cards visible but dimmed.
        suggestions: action.regenerate ? state.suggestions : [],
      };
    case 'suggestionsReceived':
      return {
        ...state,
        request: 'idle',
        suggestions: action.suggestions,
        shownActions: [...state.shownActions, ...action.suggestions.map((s) => s.action)],
      };
    case 'clarificationReceived':
      return { ...state, request: 'idle', step: 'clarify', clarification: { ...action.clarification, answer: '' } };
    case 'clarificationAnswered':
      return state.clarification ? { ...state, clarification: { ...state.clarification, answer: action.answer } } : state;
    case 'requestFailed':
      return { ...state, request: 'error' };
    case 'requestCancelled':
      return { ...state, request: 'idle' };
    case 'suggestionDismissed':
      return { ...state, suggestions: state.suggestions.filter((s) => s.id !== action.id) };
    case 'suggestionRestored': {
      if (state.suggestions.some((s) => s.id === action.suggestion.id)) return state;
      const next = [...state.suggestions];
      next.splice(Math.min(action.index, next.length), 0, action.suggestion);
      return { ...state, suggestions: next };
    }
    case 'editStarted': {
      const { trigger, action: act, durationMinutes } = action.suggestion;
      return { ...state, step: 'edit', editing: { suggestion: action.suggestion, draft: { trigger, action: act, durationMinutes } } };
    }
    case 'draftChanged':
      return state.editing ? { ...state, editing: { ...state.editing, draft: action.draft } } : state;
    case 'saved':
      return { ...state, step: 'saved', saved: action.plan };
    case 'replaced':
      return action.state;
  }
}

function nullIfBlank(text: string): string | null {
  const t = text.trim().replace(/\s+/g, ' ');
  return t === '' ? null : t;
}

/** Context is sent only when the user provided it (docs/design.md §4.3). */
export function toPlanContext(fields: ContextFields): PlanContext {
  return { outcome: nullIfBlank(fields.outcome), obstacle: nullIfBlank(fields.obstacle), timeMinutes: fields.timeMinutes };
}

export function toPlanningInput(state: PlannerState): PlanningInput {
  const answer = state.clarification?.answer.trim();
  return {
    interest: state.interest.trim(),
    context: toPlanContext(state.context),
    clarification: state.clarification && answer ? { question: state.clarification.question, answer } : null,
  };
}

// ---------------------------------------------------------------------------
// Session persistence: a refresh mid-journey keeps the user's words.
// ---------------------------------------------------------------------------

export const PLANNER_SESSION_KEY = 'ita.planner.session.v1';

export function loadPlannerSession(storage: Storage = window.sessionStorage): PlannerState | null {
  try {
    const raw = storage.getItem(PLANNER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlannerState;
    if (typeof parsed?.interest !== 'string' || typeof parsed?.step !== 'string') return null;
    // A request in flight cannot survive a reload; it is re-issued by the flow.
    return { ...INITIAL_PLANNER_STATE, ...parsed, request: parsed.request === 'loading' ? 'idle' : parsed.request };
  } catch {
    return null;
  }
}

export function savePlannerSession(state: PlannerState, storage: Storage = window.sessionStorage): void {
  try {
    storage.setItem(PLANNER_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Session storage is a convenience; the journey still works without it.
  }
}

export function clearPlannerSession(storage: Storage = window.sessionStorage): void {
  try {
    storage.removeItem(PLANNER_SESSION_KEY);
  } catch {
    // ignore
  }
}
