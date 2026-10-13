# interest-to-action
An AI-assisted product that helps people turn accumulated interests into intentional, actionable next steps.

## Development

A mobile-first web app built with Vite, React and TypeScript, styled with the Daybreak design system in [`DESIGN.md`](DESIGN.md).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and interaction tests (Vitest + Testing Library)
npm run build      # type-check and production build
```

Development-only URL options: `?latency=1500` slows loading saved plans; `?planner=fail` or `?planner=invalid` exercises the suggestion error states.

### How it fits together

- **Planning flow** (`src/features/planner/`) — the primary entry point: capture an interest → optional context → one clarification question if needed → two or three If–Then suggestions → save, edit, or dismiss → confirmation.
- **Planner** — `Planner` (`types.ts`) is the boundary for suggestions. No live AI endpoint is configured yet, so `mockPlanner.ts` provides a clearly labelled, rule-based **demo planner** that reads the interest, outcome, obstacle and time. Every response is validated (`validatePlannerResult.ts`) before it can reach the UI. A server-side AI implementation can replace it without changing any screens; API keys must never be shipped to the browser.
- **My Plans** (`src/features/plans/`) — saved plans in local storage: list, detail, progress (Not started · In progress · Completed), edit, and delete with Undo.
- **Design system** — tokens in `src/styles/tokens.css`; reusable primitives in `src/components/` (Button, TextField, ChipGroup, SegmentedControl, Sheet, Toast, Screen/TopBar, StepIndicator, ProvenanceTag, NumberStepper, EmptyState, Skeleton, SparkMark).
