import { createLocalCollection, is, type CollectionRepository } from '../../lib/localCollection';
import { MAX_DURATION_MINUTES, PLAN_STATUSES, type PlanContext, type PlanStatus, type SavedPlan } from './types';

export type PlanRepository = CollectionRepository<SavedPlan>;

export const PLANS_STORAGE_KEY = 'ita.plans.v1';
const VERSION = 1;

function parseContext(value: unknown): PlanContext | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const outcome = v.outcome ?? null;
  const obstacle = v.obstacle ?? null;
  const time = v.timeMinutes ?? null;
  if (!is.nullableString(outcome) || !is.nullableString(obstacle)) return null;
  if (time !== null && !is.positiveInt(time)) return null;
  return { outcome, obstacle, timeMinutes: time };
}

/** Validates one stored plan; anything malformed is dropped rather than shown. */
export function parsePlan(value: unknown): SavedPlan | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!is.string(v.id) || !is.nonEmptyString(v.interest)) return null;
  if (!is.nonEmptyString(v.trigger) || !is.nonEmptyString(v.action)) return null;
  if (!is.positiveInt(v.durationMinutes) || v.durationMinutes > MAX_DURATION_MINUTES) return null;
  if (!PLAN_STATUSES.includes(v.status as PlanStatus)) return null;
  if (v.origin !== 'suggested' && v.origin !== 'edited') return null;
  if (!is.string(v.createdAt) || !is.string(v.updatedAt)) return null;
  const rationale = v.rationale ?? null;
  const completedAt = v.completedAt ?? null;
  if (!is.nullableString(rationale) || !is.nullableString(completedAt)) return null;
  const context = parseContext(v.context);
  if (!context) return null;
  return {
    id: v.id,
    interest: v.interest,
    context,
    trigger: v.trigger,
    action: v.action,
    durationMinutes: v.durationMinutes,
    rationale,
    origin: v.origin,
    status: v.status as PlanStatus,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    completedAt,
  };
}

export function createLocalPlanRepository(options: { storage?: Storage; latencyMs?: number } = {}): PlanRepository {
  return createLocalCollection({ key: PLANS_STORAGE_KEY, version: VERSION, parseItem: parsePlan, ...options });
}
