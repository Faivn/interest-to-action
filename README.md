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

Append `?latency=1500` to the dev URL to preview loading states.

### Structure

- `src/styles/` — design tokens (`tokens.css`) and base typography.
- `src/components/` — reusable UI primitives: Button, IconButton, TextField, ChipGroup, SegmentedControl, Sheet, Toast, InlineMessage, EmptyState, Skeleton, SparkMark.
- `src/features/tasks/` — the task foundation: types, local storage repository, reducer, `useTasks` hook and screens. Tasks share the trigger / action / duration shape of AI action plans so saved plans can build on them.
