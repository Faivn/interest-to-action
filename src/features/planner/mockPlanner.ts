/**
 * DEMO PLANNER — not AI.
 *
 * A deterministic, rule-based stand-in for the server-side AI endpoint described in
 * docs/ai-approach.md §4, so the full journey works without an API key. It reads the
 * user's interest, outcome, obstacle and time, and composes If–Then plans from a small
 * library of beginner-friendly templates. It never invents personal details beyond a
 * suggested everyday trigger, which the user is invited to edit.
 *
 * Replace it by implementing `Planner` against a real endpoint; nothing else changes.
 */
import type { ClarificationRequest, Planner, PlannerResult, PlanningInput, PlanSuggestion, SuggestOptions } from './types';

// ---------------------------------------------------------------------------
// Interpreting the interest
// ---------------------------------------------------------------------------

export type InterestKind = 'learn' | 'do';

export interface Interpretation {
  kind: InterestKind;
  /** learn: a noun topic ("UI animation"); do: a verb phrase ("write a short story"). */
  subject: string;
  /** Minutes mentioned in the text itself, e.g. "I only have 10 minutes". */
  statedMinutes: number | null;
  vague: boolean;
}

// Contractions are expanded before matching (see `expandContractions`).
const LEADS: RegExp[] = [
  /^(?:i\s+)?(?:really\s+|finally\s+|still\s+)?(?:want|would like|would love|wanna|need|hope|plan|intend|am going|have always wanted|always wanted)\s+to\s+/i,
  /^(?:i\s+)?have\s+been\s+meaning\s+to\s+/i,
  /^(?:i\s+)?wish\s+i\s+could\s+/i,
  /^(?:to|maybe|finally|actually|really|properly|seriously|somehow)\s+/i,
];
const CURIOUS_LEAD = /^i am\s+(?:interested in|curious about|into)\s+/i;
const LEARN_HOW = /^(?:learn|figure out|find out|work out)\s+(?:how\s+)?to\s+/i;
const LEARN_LEAD =
  /^(?:learn(?:ing)?(?:\s+(?:about|more about|the basics of))?|study(?:ing)?|understand|get (?:better|good) at|improve(?: at| my)?|explore|try out|read (?:up )?(?:on|about)|look into|dive into|pick up|brush up on|master|teach myself|get into)\s+/i;

const DO_VERBS = new Set(
  `start begin write read build make create draw paint sketch cook bake run jog swim cycle ride play practise practice
   sing dance record launch finish design code grow plant knit sew crochet journal meditate travel visit join volunteer
   apply save declutter organise organize take go film photograph publish blog podcast train walk hike climb speak do
   get become contribute research redesign fix update find host teach ship sell open restart rebuild prepare plan`
    .split(/\s+/)
    .filter(Boolean),
);

const STOP = new Set(
  `a an the to of in on at for with and or my me i it is be do get make some more something anything stuff things new
   start try really better bit little lot thing way kind sort just`.split(/\s+/),
);
// Capitals worth keeping when a single word starts the interest ("Python", not "Photography").
const PROPER_NOUNS = new Set(
  `spanish french german japanese italian mandarin chinese korean portuguese arabic hindi english russian dutch swedish
   greek turkish polish welsh irish python javascript typescript java swift kotlin rust ruby php sql html css react
   figma excel photoshop illustrator blender unity procreate notion linux`.split(/\s+/).filter(Boolean),
);
const FREQUENCY = /\s+(?:every ?day|daily|each day|every week|weekly|regularly|more often|consistently|every morning|every evening)$/i;

const VAGUE =
  /\b(something|anything|stuff|things|somehow|whatever|productive|my life|my goals|happier|healthier|improve myself|new skills?|a hobby)\b/i;

function expandContractions(text: string): string {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/\bi'm\b/gi, 'I am')
    .replace(/\bi've\b/gi, 'I have')
    .replace(/\bi'd\b/gi, 'I would')
    .replace(/\bi'll\b/gi, 'I will');
}

function tidy(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '');
}

function statedMinutes(text: string): number | null {
  const mins = text.match(/(\d{1,3})\s*-?\s*(?:min|mins|minute|minutes)\b/i);
  if (mins) return Number(mins[1]);
  const hours = text.match(/(\d{1,2}(?:\.\d)?)\s*-?\s*(?:h|hr|hrs|hour|hours)\b/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  if (/\bhalf an hour\b/i.test(text)) return 30;
  if (/\ban hour\b/i.test(text)) return 60;
  return null;
}

function meaningfulWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

export function interpretInterest(raw: string): Interpretation {
  const text = tidy(expandContractions(raw));
  const minutes = statedMinutes(text);

  // Keep the core idea; drop constraints such as ", but I only have 10 minutes".
  let core = text.split(/\s*(?:[,;(]|\.\s|\s[-–—]\s|\s(?:but|because|since|although|though|so that|as long as|when i have|in my spare time)\s)/i)[0];
  core = tidy(core);

  let previous = '';
  while (previous !== core) {
    previous = core;
    for (const lead of LEADS) core = core.replace(lead, '');
  }

  let kind: InterestKind;
  let subject: string;
  if (CURIOUS_LEAD.test(core)) {
    kind = 'learn';
    subject = core.replace(CURIOUS_LEAD, '');
  } else if (LEARN_HOW.test(core)) {
    kind = 'do';
    subject = core.replace(LEARN_HOW, '');
  } else if (LEARN_LEAD.test(core)) {
    kind = 'learn';
    subject = core.replace(LEARN_LEAD, '');
  } else if (/^try\s+/i.test(core)) {
    const rest = core.replace(/^try\s+/i, '');
    const firstWord = rest.split(' ')[0].toLowerCase();
    kind = DO_VERBS.has(firstWord) ? 'do' : 'learn';
    subject = rest;
  } else {
    const firstWord = core.split(' ')[0].toLowerCase();
    kind = DO_VERBS.has(firstWord) ? 'do' : 'learn';
    subject = core;
  }

  // A capital that only marks the start of the user's sentence shouldn't survive mid-sentence.
  const startedSentence = subject === core;
  subject = tidy(subject).replace(FREQUENCY, '');
  if (kind === 'learn') subject = subject.replace(/^(?:a|an|the|some)\s+/i, '');
  const firstWord = subject.split(' ')[0];
  if (kind === 'learn' && startedSentence && /^[A-Z][a-z]/.test(firstWord) && !PROPER_NOUNS.has(firstWord.toLowerCase())) {
    subject = subject.charAt(0).toLowerCase() + subject.slice(1);
  }
  // Lower-case a leading verb or common noun, but keep proper nouns/acronyms the user typed ("Python", "UI").
  if (kind === 'do') subject = subject.charAt(0).toLowerCase() + subject.slice(1);

  const words = meaningfulWords(subject);
  const vague = subject.length < 3 || words.length === 0 || (VAGUE.test(subject) && words.length <= 1);

  return { kind, subject, statedMinutes: minutes, vague };
}

// ---------------------------------------------------------------------------
// Clarification (asked at most once, never presented as an error)
// ---------------------------------------------------------------------------

const DOMAINS: { match: RegExp; question: string; options: string[] }[] = [
  {
    match: /\b(design|ui|ux|graphic|visual|illustrat)/i,
    question: 'What kind of design interests you most?',
    options: ['Visual design', 'Product design', 'UI animation', 'Illustration'],
  },
  {
    match: /\b(music|instrument|song|guitar|piano|sing)/i,
    question: 'Which part of music would you like to explore?',
    options: ['Play an instrument', 'Write songs', 'Make beats', 'Sing'],
  },
  {
    match: /\b(fit|fitness|exercise|active|sport|move|movement|healthier|strength)/i,
    question: 'What kind of movement sounds most appealing?',
    options: ['Start running', 'Build strength', 'Try yoga', 'Go for daily walks'],
  },
  {
    match: /\b(code|coding|program|tech|software|app|web|developer)/i,
    question: 'What would you like to build or learn first?',
    options: ['Python basics', 'Build a website', 'Make a mobile app', 'Analyse data'],
  },
  {
    match: /\b(writ|blog|story|stories|book|journal|poem|poetry)/i,
    question: 'What kind of writing are you drawn to?',
    options: ['Write short stories', 'Start a blog', 'Keep a journal', 'Write poetry'],
  },
  {
    match: /\b(art|draw|paint|craft|creative|photo)/i,
    question: 'Which creative outlet appeals to you most?',
    options: ['Drawing', 'Painting', 'Photography', 'Pottery'],
  },
  {
    match: /\b(career|job|business|work|money|side hustle)/i,
    question: 'What would you like to move forward on?',
    options: ['Update my CV', 'Explore a side business idea', 'Practise for interviews', 'Find a mentor'],
  },
];

const OPTION_ANSWERS = new Set(DOMAINS.flatMap((d) => d.options));

/** Chip labels are title-cased for display; inside a sentence they read as ordinary words ("product design"). */
function asSentenceText(answer: string): string {
  if (!OPTION_ANSWERS.has(answer) || /^[A-Z]{2}/.test(answer)) return answer;
  return answer.charAt(0).toLowerCase() + answer.slice(1);
}

export function clarificationFor(interest: string): ClarificationRequest {
  const domain = DOMAINS.find((d) => d.match.test(interest));
  if (domain) return { question: domain.question, options: domain.options };
  return {
    question: 'What would you most like to be able to do, make, or understand?',
    options: [],
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/** "start a blog" → "a blog"; null when the phrase doesn't begin with start/begin. */
function afterStart(verbPhrase: string): string | null {
  const match = verbPhrase.match(/^(?:start|begin)\s+(.+)$/i);
  return match ? match[1] : null;
}

type Tag =
  | 'resource'
  | 'handsOn'
  | 'tiny'
  | 'start'
  | 'overwhelm'
  | 'motivation'
  | 'perfection'
  | 'forget'
  | 'time'
  | 'money'
  | 'alone'
  | 'portable';

interface Template {
  id: string;
  kind: InterestKind;
  action: (subject: string) => string;
  minutes: number;
  tags: Tag[];
  rationale: string;
}

const TEMPLATES: Template[] = [
  // learn — subject is a topic
  {
    id: 'l-first-lesson',
    kind: 'learn',
    action: (t) => `Find a free beginner ${t} tutorial and watch the first lesson`,
    minutes: 15,
    tags: ['resource', 'start', 'money'],
    rationale: 'Watching just the first lesson keeps the commitment small and shows you what the topic feels like.',
  },
  {
    id: 'l-follow-along',
    kind: 'learn',
    action: (t) => `Follow one short ${t} tutorial and recreate its first example`,
    minutes: 20,
    tags: ['handsOn', 'perfection'],
    rationale: 'Making something yourself, even a copy, turns an idea into real progress.',
  },
  {
    id: 'l-curiosity',
    kind: 'learn',
    action: (t) => `Jot down what I'm most curious about in ${t}`,
    minutes: 10,
    tags: ['overwhelm', 'start', 'portable'],
    rationale: 'Naming what interests you most narrows a big topic to one place to begin.',
  },
  {
    id: 'l-intro-read',
    kind: 'learn',
    action: (t) => `Read one short beginner's introduction to ${t}`,
    minutes: 10,
    tags: ['tiny', 'motivation', 'time', 'portable', 'money'],
    rationale: 'A short read is easy to begin, even on a low-energy day.',
  },
  {
    id: 'l-shortlist',
    kind: 'learn',
    action: (t) => `Browse beginner ${t} resources and shortlist the one I'd enjoy most`,
    minutes: 5,
    tags: ['tiny', 'forget', 'start', 'portable'],
    rationale: 'Choosing one resource now means there is less to decide next time.',
  },
  {
    id: 'l-exercise',
    kind: 'learn',
    action: (t) => `Try one beginner ${t} exercise`,
    minutes: 20,
    tags: ['handsOn', 'perfection', 'motivation'],
    rationale: 'Keeping whatever you make, rough or not, takes away the pressure to get it right.',
  },
  {
    id: 'l-community',
    kind: 'learn',
    action: (t) => `Look through a few ${t} communities online`,
    minutes: 10,
    tags: ['alone', 'motivation', 'portable'],
    rationale: 'Seeing other people learning the same thing makes it easier to keep going.',
  },
  // do — subject is a verb phrase
  {
    id: 'd-rough',
    kind: 'do',
    action: (v) => (afterStart(v) ? `Make a rough first attempt at ${afterStart(v)}` : `Make a rough first attempt to ${v}`),
    minutes: 15,
    tags: ['handsOn', 'perfection', 'motivation'],
    rationale: 'A deliberately rough first go takes away the pressure to get it right.',
  },
  {
    id: 'd-guide',
    kind: 'do',
    action: (v) => `Follow one beginner guide on how to ${v}`,
    minutes: 15,
    tags: ['resource', 'start', 'money'],
    rationale: "Borrowing someone else's first steps saves you from planning everything yourself.",
  },
  {
    id: 'd-ready',
    kind: 'do',
    action: (v) => `Get everything ready to ${v}`,
    minutes: 5,
    tags: ['tiny', 'forget', 'time'],
    rationale: 'Having everything ready makes the next start quicker and easier to remember.',
  },
  {
    id: 'd-smallest',
    kind: 'do',
    action: (v) => `Plan the smallest possible way to ${v}`,
    minutes: 10,
    tags: ['overwhelm', 'start', 'portable'],
    rationale: 'A smaller version is far easier to start than the whole thing.',
  },
  {
    id: 'd-tiny-version',
    kind: 'do',
    action: (v) => `Try a tiny first version: ${v}`,
    minutes: 10,
    tags: ['tiny', 'motivation', 'time', 'handsOn'],
    rationale: 'Starting is often the hardest part; one small step is enough to get going.',
  },
  {
    id: 'd-others',
    kind: 'do',
    action: (v) => (afterStart(v) ? `Read how a few beginners got started with ${afterStart(v)}` : `Read how a few beginners learned to ${v}`),
    minutes: 10,
    tags: ['alone', 'start', 'portable'],
    rationale: 'Hearing how others began makes the first step feel more achievable.',
  },
];

const OBSTACLES: { tag: Tag; match: RegExp; rationale: string }[] = [
  {
    tag: 'time',
    match: /\b(time|busy|schedule|work|kids|children|tired|energy|exhausted)\b/i,
    rationale: "It's tied to an everyday moment, so it doesn't need a new slot in your day.",
  },
  {
    tag: 'overwhelm',
    match: /(where to (start|begin)|don'?t know how|no idea|overwhelm|too (big|much|many)|confus|complicated)/i,
    rationale: 'It gives you one clear first step instead of a whole plan.',
  },
  {
    tag: 'motivation',
    match: /(motivat|procrastinat|lazy|bored|put(ting)? (it )?off|can'?t be bothered|keep delaying)/i,
    rationale: "It's small enough to start even when motivation is low.",
  },
  {
    tag: 'perfection',
    match: /(perfect|good enough|fear|scared|afraid|embarrass|fail|judg|not talented|bad at)/i,
    rationale: 'Aiming for rough, not right, takes the pressure off.',
  },
  {
    tag: 'forget',
    match: /(forget|remember|consisten|stick with|keep it up|lose track)/i,
    rationale: "Tying it to an everyday moment means you don't have to rely on remembering.",
  },
  {
    tag: 'money',
    match: /(money|afford|expensive|cost|budget|pay)/i,
    rationale: "It starts with free resources, so cost isn't a barrier.",
  },
  {
    tag: 'alone',
    match: /(alone|no one|nobody|lonely|accountab|on my own)/i,
    rationale: 'Seeing others on the same path makes it easier to keep going.',
  },
];

// Everyday moments, phrased to follow "When …". Users are invited to change them.
const TRIGGERS: { text: string; maxMinutes?: number; portable?: boolean }[] = [
  { text: 'I finish breakfast' },
  { text: 'my morning coffee is brewing', maxMinutes: 5 },
  { text: 'I sit down at my desk in the morning' },
  { text: 'I come back from lunch' },
  { text: 'I get on the bus or train home', portable: true },
  { text: 'I finish dinner, before picking up my phone' },
  { text: 'I get home and put my bag down', maxMinutes: 10 },
  { text: 'I sit down on the sofa in the evening' },
  { text: 'I close my laptop at the end of the day' },
];

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quoted(text: string): string {
  return `“${tidy(text)}”`;
}

export function composeSuggestions(input: PlanningInput, options: Pick<SuggestOptions, 'attempt' | 'exclude'>): PlanSuggestion[] {
  const fromInterest = interpretInterest(input.interest);
  const answer = input.clarification?.answer.trim();
  const reading = answer
    ? { ...interpretInterest(asSentenceText(answer)), statedMinutes: fromInterest.statedMinutes }
    : fromInterest;

  const timeLimit = input.context.timeMinutes ?? reading.statedMinutes;
  const obstacle = input.context.obstacle ? OBSTACLES.find((o) => o.match.test(input.context.obstacle!)) : undefined;
  const capMinutes = timeLimit ?? (obstacle?.tag === 'time' ? 10 : null);

  const random = seededRandom(
    hash([input.interest, answer, input.context.outcome, input.context.obstacle, timeLimit, options.attempt].join('|')),
  );
  const excluded = new Set(options.exclude.map((a) => a.toLowerCase()));

  const scored = TEMPLATES.filter((t) => t.kind === reading.kind)
    .map((t) => {
      const action = t.action(reading.subject);
      let score = random();
      if (obstacle && t.tags.includes(obstacle.tag)) score += 3;
      if (capMinutes !== null && capMinutes <= 10 && t.tags.includes('tiny')) score += 1.5;
      if (capMinutes !== null && capMinutes >= 20 && t.tags.includes('handsOn')) score += 1;
      if (excluded.has(action.toLowerCase())) score -= 10; // only reused if nothing new is left
      return { template: t, action, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, 3);

  // Distinct everyday triggers; portable actions may use commute moments.
  const triggerPool = [...TRIGGERS].sort(() => random() - 0.5);
  const usedTriggers = new Set<string>();
  let obstacleAddressed = false;

  return picked.map(({ template, action }, index) => {
    const minutes = Math.max(1, capMinutes !== null ? Math.min(template.minutes, capMinutes) : template.minutes);
    const trigger =
      triggerPool.find(
        (t) =>
          !usedTriggers.has(t.text) &&
          (t.maxMinutes === undefined || minutes <= t.maxMinutes) &&
          (!t.portable || template.tags.includes('portable')),
      ) ?? triggerPool.find((t) => !usedTriggers.has(t.text))!;
    usedTriggers.add(trigger.text);

    // Speak to the obstacle once; repeating the same reason on every card adds reading without adding meaning.
    const addressesObstacle = !obstacleAddressed && obstacle !== undefined && template.tags.includes(obstacle.tag);
    if (addressesObstacle) obstacleAddressed = true;
    let rationale = addressesObstacle ? obstacle.rationale : template.rationale;
    if (index === 0 && input.context.outcome?.trim()) {
      rationale += ` It's a first step towards ${quoted(input.context.outcome)}.`;
    }

    return {
      id: `${template.id}-${options.attempt}`,
      trigger: trigger.text,
      action,
      durationMinutes: minutes,
      rationale,
    };
  });
}

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

export interface MockPlannerOptions {
  /** Simulated thinking time so loading states are realistic. */
  latencyMs?: number;
  /** For exercising error paths during development. */
  failMode?: 'none' | 'error' | 'invalid';
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export function createMockPlanner({ latencyMs = 1100, failMode = 'none' }: MockPlannerOptions = {}): Planner {
  return {
    source: 'demo',
    async suggest(input, options): Promise<PlannerResult> {
      await delay(latencyMs, options.signal);
      if (failMode === 'error') throw new Error('The demo planner is set to fail.');
      if (failMode === 'invalid') return { kind: 'suggestions', suggestions: [] };

      if (options.allowClarification && !input.clarification) {
        const reading = interpretInterest(input.interest);
        if (reading.vague) return { kind: 'clarification', clarification: clarificationFor(input.interest) };
      }
      return { kind: 'suggestions', suggestions: composeSuggestions(input, options) };
    },
  };
}
