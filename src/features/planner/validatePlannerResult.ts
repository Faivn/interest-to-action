import { MAX_DURATION_MINUTES } from '../plans/types';
import type { PlannerResult, PlanSuggestion } from './types';

export class InvalidPlannerResponse extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlannerResponse';
  }
}

const MIN_SUGGESTIONS = 2;
const MAX_SUGGESTIONS = 3;

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || value.trim() === '') throw new InvalidPlannerResponse(`Missing ${field}.`);
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length > max) throw new InvalidPlannerResponse(`${field} is too long.`);
  return trimmed;
}

function suggestion(value: unknown, index: number): PlanSuggestion {
  if (typeof value !== 'object' || value === null) throw new InvalidPlannerResponse('Malformed suggestion.');
  const v = value as Record<string, unknown>;
  const minutes = v.durationMinutes;
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1 || minutes > MAX_DURATION_MINUTES) {
    throw new InvalidPlannerResponse('Invalid duration.');
  }
  const rationale = v.rationale == null || v.rationale === '' ? null : text(v.rationale, 'rationale', 280);
  return {
    id: typeof v.id === 'string' && v.id ? v.id : `suggestion-${index}`,
    trigger: text(v.trigger, 'trigger', 160),
    action: text(v.action, 'action', 200),
    durationMinutes: minutes,
    rationale,
  };
}

/**
 * Validates any planner output before it can reach the UI (docs/ai-approach.md §5, §7).
 * Invalid data is never shown as a plan.
 */
export function validatePlannerResult(result: unknown): PlannerResult {
  if (typeof result !== 'object' || result === null) throw new InvalidPlannerResponse('Empty response.');
  const r = result as Record<string, unknown>;

  if (r.kind === 'clarification') {
    const c = r.clarification as Record<string, unknown> | undefined;
    if (!c) throw new InvalidPlannerResponse('Missing clarification.');
    const options = Array.isArray(c.options)
      ? c.options.filter((o): o is string => typeof o === 'string' && o.trim() !== '').slice(0, 4)
      : [];
    return { kind: 'clarification', clarification: { question: text(c.question, 'question', 200), options } };
  }

  if (r.kind === 'suggestions' && Array.isArray(r.suggestions)) {
    const list = r.suggestions.map(suggestion);
    if (list.length < MIN_SUGGESTIONS || list.length > MAX_SUGGESTIONS) {
      throw new InvalidPlannerResponse('Expected two or three suggestions.');
    }
    const actions = new Set(list.map((s) => s.action.toLowerCase()));
    if (actions.size !== list.length) throw new InvalidPlannerResponse('Duplicate suggestions.');
    return { kind: 'suggestions', suggestions: list };
  }

  throw new InvalidPlannerResponse('Unrecognised response.');
}
