import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/instrument-sans/index.css';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { createLocalTaskRepository } from './features/tasks/taskRepository';

// Development aid: append ?latency=1200 to the URL to exercise loading states.
const latencyMs = import.meta.env.DEV
  ? Number(new URLSearchParams(window.location.search).get('latency')) || 0
  : 0;

const repository = createLocalTaskRepository({ latencyMs });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repository={repository} />
  </StrictMode>,
);
