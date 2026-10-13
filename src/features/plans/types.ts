export type PlanStatus = 'not-started' | 'in-progress' | 'completed';

export const PLAN_STATUSES: readonly PlanStatus[] = ['not-started', 'in-progress', 'completed'];

export const STATUS_LABEL: Record<PlanStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
};

/** Optional context the user chose to share (docs/ai-approach.md §2). `null` means "not provided". */
export interface PlanContext {
  outcome: string | null;
  obstacle: string | null;
  timeMinutes: number | null;
}

export const EMPTY_CONTEXT: PlanContext = { outcome: null, obstacle: null, timeMinutes: null };

/** The editable If–Then core of a plan. */
export interface PlanDraft {
  trigger: string;
  action: string;
  durationMinutes: number;
}

/** A plan the user explicitly saved, together with the interest it came from. */
export interface SavedPlan extends PlanDraft {
  id: string;
  interest: string;
  context: PlanContext;
  rationale: string | null;
  /** Whether the user saved the suggestion as offered or changed it first. */
  origin: 'suggested' | 'edited';
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export const MAX_DURATION_MINUTES = 240;

/** Matches the time chips in docs/design.md §4.3. */
export const TIME_OPTIONS: readonly { value: number | null; label: string }[] = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30+ min' },
  { value: null, label: 'Not sure' },
];

export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}

const TRIGGER_LEAD = /^(when|whenever|after|before|once|as soon as|while|if|at|on|every|each)\b/i;
const ACTION_LEAD = /^(i'll|i will|then i'll|then i will)\s+/i;

/** Lower-cases the first letter unless the word looks like an acronym ("UI", "CSS"). */
function lowerFirst(text: string): string {
  if (text.length > 1 && text[1] === text[1].toUpperCase() && /[A-Z]/.test(text[1])) return text;
  if (/^I\b/.test(text)) return text; // keep the pronoun "I"
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function clean(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.,;:!]+$/, '');
}

/** "I finish breakfast" → "When I finish breakfast"; "After lunch" stays "After lunch". */
export function formatTrigger(trigger: string): string {
  const t = clean(trigger);
  if (!t) return '';
  return TRIGGER_LEAD.test(t) ? upperFirst(t) : `When ${lowerFirst(t)}`;
}

export interface PlanSentenceParts {
  /** "When " — or "" when the trigger already starts with its own lead ("After lunch"). */
  opener: string;
  trigger: string;
  action: string;
  /** "15 minutes", or null while the duration is missing. */
  duration: string | null;
}

export function planSentenceParts({ trigger, action, durationMinutes }: PlanDraft): PlanSentenceParts {
  const t = clean(trigger);
  const hasLead = TRIGGER_LEAD.test(t);
  const minutes = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : null;
  return {
    opener: t && hasLead ? '' : 'When ',
    trigger: t ? (hasLead ? upperFirst(t) : lowerFirst(t)) : '…',
    action: lowerFirst(clean(action).replace(ACTION_LEAD, '')) || '…',
    duration: minutes ? `${minutes} minute${minutes === 1 ? '' : 's'}` : null,
  };
}

/**
 * The canonical plan sentence (docs/design.md §6):
 * "When [trigger], I'll [action] for [duration] minutes."
 */
export function formatPlanSentence(draft: PlanDraft): string {
  const p = planSentenceParts(draft);
  return `${p.opener}${p.trigger}, I'll ${p.action}${p.duration ? ` for ${p.duration}` : ''}.`;
}

export function draftFromPlan(plan: PlanDraft): PlanDraft {
  return { trigger: plan.trigger, action: plan.action, durationMinutes: plan.durationMinutes };
}

export interface DraftErrors {
  trigger?: string;
  action?: string;
  durationMinutes?: string;
}

/** Trigger and action cannot be empty; duration must be a positive number (docs/design.md §4.6). */
export function validateDraft(draft: PlanDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.trigger.trim()) errors.trigger = 'Add a moment that will remind you to start.';
  if (!draft.action.trim()) errors.action = 'Add the step you will take.';
  if (!Number.isInteger(draft.durationMinutes) || draft.durationMinutes < 1) {
    errors.durationMinutes = 'Enter a number of minutes, 1 or more.';
  } else if (draft.durationMinutes > MAX_DURATION_MINUTES) {
    errors.durationMinutes = `Keep it to ${MAX_DURATION_MINUTES} minutes or less. Small steps are easier to start.`;
  }
  return errors;
}

export function sameDraft(a: PlanDraft, b: PlanDraft): boolean {
  return (
    clean(a.trigger) === clean(b.trigger) &&
    clean(a.action) === clean(b.action) &&
    a.durationMinutes === b.durationMinutes
  );
}
