import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/instrument-sans/index.css';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { createMockPlanner } from './features/planner/mockPlanner';
import { createLocalPlanRepository } from './features/plans/planRepository';

// Development aids (ignored in production builds):
//   ?latency=1500        slow down loading saved plans
//   ?planner=fail        make suggestion requests fail
//   ?planner=invalid     make the planner return malformed data
const params = new URLSearchParams(window.location.search);
const dev = import.meta.env.DEV;
const latencyMs = dev ? Number(params.get('latency')) || 0 : 0;
const plannerParam = dev ? params.get('planner') : null;
const failMode = plannerParam === 'fail' ? 'error' : plannerParam === 'invalid' ? 'invalid' : 'none';

const repository = createLocalPlanRepository({ latencyMs });

// No live AI endpoint is configured yet, so the clearly labelled demo planner is used.
// A server-backed `Planner` can be swapped in here without changing any screens.
const planner = createMockPlanner({ failMode });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repository={repository} planner={planner} />
  </StrictMode>,
);
