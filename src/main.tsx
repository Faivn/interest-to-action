import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/instrument-sans/index.css';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { createHttpPlanner, isLivePlannerAvailable } from './features/planner/httpPlanner';
import { createMockPlanner } from './features/planner/mockPlanner';
import type { Planner } from './features/planner/types';
import { createLocalPlanRepository } from './features/plans/planRepository';

// Development aids (ignored in production builds):
//   ?latency=1500        slow down loading saved plans
//   ?planner=demo        force the built-in demo planner
//   ?planner=fail        demo planner that always fails
//   ?planner=invalid     demo planner that returns malformed data
const params = new URLSearchParams(window.location.search);
const dev = import.meta.env.DEV;
const latencyMs = dev ? Number(params.get('latency')) || 0 : 0;
const plannerParam = dev ? params.get('planner') : null;

const repository = createLocalPlanRepository({ latencyMs });

/**
 * Live suggestions come from Groq through the server endpoint when it is configured.
 * The labelled demo planner is used only when no key is configured at all; if Groq fails,
 * the flow shows its error state with Try again rather than silently switching.
 */
async function choosePlanner(): Promise<Planner> {
  if (plannerParam === 'fail') return createMockPlanner({ failMode: 'error' });
  if (plannerParam === 'invalid') return createMockPlanner({ failMode: 'invalid' });
  if (plannerParam === 'demo') return createMockPlanner();
  return (await isLivePlannerAvailable()) ? createHttpPlanner() : createMockPlanner();
}

void choosePlanner().then((planner) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App repository={repository} planner={planner} />
    </StrictMode>,
  );
});
