import type { PlanContext } from '../plans/types';

/** Everything the user told us. Missing context stays `null` — the planner must not invent it. */
export interface PlanningInput {
  interest: string;
  context: PlanContext;
  /** The user's answer to a clarification question, if one was asked. */
  clarification: { question: string; answer: string } | null;
}

export interface PlanSuggestion {
  id: string;
  trigger: string;
  action: string;
  durationMinutes: number;
  rationale: string | null;
}

export interface ClarificationRequest {
  question: string;
  /** Suggested answers shown as chips; the user can always type their own. */
  options: string[];
}

export type PlannerResult =
  | { kind: 'suggestions'; suggestions: PlanSuggestion[] }
  | { kind: 'clarification'; clarification: ClarificationRequest };

export interface SuggestOptions {
  /** 0 for the first request, incremented by "Show different ideas". */
  attempt: number;
  /** Actions already shown, so alternatives are genuinely different. */
  exclude: string[];
  /** A clarification is asked at most once per journey (docs/design.md §4.4). */
  allowClarification: boolean;
  signal?: AbortSignal;
}

/**
 * The planning boundary. The demo uses `createMockPlanner`; a live implementation
 * would call a server-side endpoint (docs/ai-approach.md §4) — API keys never reach the browser.
 */
export interface Planner {
  /** Shown to users so they know where suggestions come from. */
  readonly source: 'demo' | 'ai';
  suggest(input: PlanningInput, options: SuggestOptions): Promise<PlannerResult>;
}
