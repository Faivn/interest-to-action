/**
 * JSON schema for Groq structured outputs (strict mode).
 * Strict mode requires every property to be listed in `required` and every object to set
 * `additionalProperties: false`; optional values are expressed as `null` unions.
 * Counts (2–3 suggestions) and lengths are enforced afterwards by `validatePlannerResult`.
 */

const suggestion = {
  type: 'object',
  additionalProperties: false,
  required: ['trigger', 'action', 'duration_minutes', 'rationale'],
  properties: {
    trigger: {
      type: 'string',
      description: 'An everyday moment, phrased to follow "When …", e.g. "I finish breakfast". No leading "When".',
    },
    action: {
      type: 'string',
      description: 'One specific, beginner-friendly step, phrased to follow "I\'ll …", starting with a verb. No duration.',
    },
    duration_minutes: { type: 'integer', description: 'Whole minutes, 1–240, within any time limit the user gave.' },
    rationale: {
      type: ['string', 'null'],
      description: 'One short sentence on why this is manageable, referring only to what the user said.',
    },
  },
} as const;

const clarification = {
  type: 'object',
  additionalProperties: false,
  required: ['question', 'options'],
  properties: {
    question: { type: 'string', description: 'One short, friendly question.' },
    options: {
      type: 'array',
      description: 'Two to four short answer chips (2–4 words each), or an empty array.',
      items: { type: 'string' },
    },
  },
} as const;

export function planSchema(allowClarification: boolean) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['kind', 'suggestions', 'clarification'],
    properties: {
      kind: { type: 'string', enum: allowClarification ? ['suggestions', 'clarification'] : ['suggestions'] },
      suggestions: {
        type: 'array',
        description: 'Two or three plans when kind is "suggestions"; an empty array otherwise.',
        items: suggestion,
      },
      clarification: allowClarification
        ? { anyOf: [{ type: 'null' }, clarification], description: 'Only when kind is "clarification".' }
        : { type: 'null' },
    },
  };
}

/** The raw shape the model returns. */
export interface ModelOutput {
  kind: 'suggestions' | 'clarification';
  suggestions: { trigger: string; action: string; duration_minutes: number; rationale: string | null }[];
  clarification: { question: string; options: string[] } | null;
}
