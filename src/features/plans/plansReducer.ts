import type { PlanContext, PlanDraft, PlanStatus, SavedPlan } from './types';

export type PlansAction =
  | { type: 'replaced'; plans: SavedPlan[] }
  | { type: 'added'; plan: SavedPlan }
  | { type: 'edited'; id: string; draft: PlanDraft; now: string }
  | { type: 'statusSet'; id: string; status: PlanStatus; now: string }
  | { type: 'removed'; id: string }
  | { type: 'restored'; plan: SavedPlan; index: number };

export interface NewPlanInput {
  interest: string;
  context: PlanContext;
  draft: PlanDraft;
  rationale: string | null;
  origin: SavedPlan['origin'];
}

function tidy(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function normaliseDraft(draft: PlanDraft): PlanDraft {
  return { trigger: tidy(draft.trigger), action: tidy(draft.action), durationMinutes: draft.durationMinutes };
}

export function createPlan(input: NewPlanInput, id: string, now: string): SavedPlan {
  return {
    id,
    interest: tidy(input.interest),
    context: input.context,
    ...normaliseDraft(input.draft),
    rationale: input.rationale,
    origin: input.origin,
    status: 'not-started',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

/** Plans are stored newest first. */
export function plansReducer(plans: SavedPlan[], action: PlansAction): SavedPlan[] {
  switch (action.type) {
    case 'replaced':
      return action.plans;
    case 'added':
      return [action.plan, ...plans];
    case 'edited':
      return plans.map((p) =>
        p.id === action.id ? { ...p, ...normaliseDraft(action.draft), origin: 'edited', updatedAt: action.now } : p,
      );
    case 'statusSet':
      return plans.map((p) =>
        p.id === action.id
          ? {
              ...p,
              status: action.status,
              completedAt: action.status === 'completed' ? (p.completedAt ?? action.now) : null,
              updatedAt: action.now,
            }
          : p,
      );
    case 'removed':
      return plans.filter((p) => p.id !== action.id);
    case 'restored': {
      if (plans.some((p) => p.id === action.plan.id)) return plans;
      const index = Math.min(Math.max(action.index, 0), plans.length);
      return [...plans.slice(0, index), action.plan, ...plans.slice(index)];
    }
  }
}

export function selectCurrent(plans: SavedPlan[]): SavedPlan[] {
  return plans.filter((p) => p.status !== 'completed');
}

/** Most recently completed first. */
export function selectCompleted(plans: SavedPlan[]): SavedPlan[] {
  return plans
    .filter((p) => p.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}
