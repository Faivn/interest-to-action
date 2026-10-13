import { useEffect } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { ToastProvider } from './components/Toast';
import { PlannerFlow } from './features/planner/PlannerFlow';
import { clearPlannerSession } from './features/planner/plannerState';
import type { Planner } from './features/planner/types';
import { PlanDetailScreen } from './features/plans/PlanDetailScreen';
import type { PlanRepository } from './features/plans/planRepository';
import { PlansScreen } from './features/plans/PlansScreen';
import { PlansProvider } from './features/plans/usePlans';
import { WelcomeScreen } from './features/welcome/WelcomeScreen';
import { useHashRoute } from './lib/useHashRoute';
import { useMediaQuery } from './lib/useMediaQuery';
import './App.css';

const ONBOARDED_KEY = 'ita.onboarded';

/** Motion's layout/drag engine arrives as its own chunk after first paint. */
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

function hasOnboarded(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

function markOnboarded() {
  try {
    window.localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // Without storage the welcome screen may show again; nothing else depends on it.
  }
}

interface AppProps {
  repository: PlanRepository;
  planner: Planner;
}

export function App({ repository, planner }: AppProps) {
  return (
    // Motion honours the user's reduced-motion setting everywhere (DESIGN.md §11.3).
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <ToastProvider>
          <PlansProvider repository={repository}>
            <main>
              <Routes planner={planner} />
            </main>
          </PlansProvider>
        </ToastProvider>
      </LazyMotion>
    </MotionConfig>
  );
}

function Routes({ planner }: { planner: Planner }) {
  const [path, navigate] = useHashRoute();
  // Expanded layout: My Plans becomes list + detail (DESIGN.md §12).
  const expanded = useMediaQuery('(min-width: 1024px)');

  // First-time users see Welcome; everyone else opens on My Plans (docs/design.md §3).
  useEffect(() => {
    if (path === '') navigate(hasOnboarded() ? '/plans' : '/welcome', { replace: true });
    else if (path !== '/welcome') markOnboarded();
  }, [path, navigate]);

  const startNewInterest = () => {
    clearPlannerSession();
    navigate('/new');
  };

  if (path === '/welcome') {
    return (
      <WelcomeScreen
        onStart={() => {
          markOnboarded();
          startNewInterest();
        }}
      />
    );
  }

  if (path === '/new') {
    return <PlannerFlow planner={planner} navigate={navigate} />;
  }

  const detail = path.match(/^\/plans\/([^/]+)$/);
  const openPlan = (id: string) => navigate(`/plans/${encodeURIComponent(id)}`);

  if (expanded && (path === '/plans' || detail)) {
    const selectedId = detail ? decodeURIComponent(detail[1]) : null;
    return (
      <div className="plans-split">
        <div className="plans-split__list">
          <PlansScreen onAddInterest={startNewInterest} onOpenPlan={(plan) => openPlan(plan.id)} selectedId={selectedId} pane />
        </div>
        <div className="plans-split__detail">
          {selectedId ? (
            <PlanDetailScreen key={selectedId} planId={selectedId} onBack={() => navigate('/plans')} embedded />
          ) : (
            <div className="plans-split__placeholder">
              <p className="t-title-2">Choose a plan</p>
              <p className="t-callout">Select a plan to see the details, update progress, or make changes.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (detail) {
    return <PlanDetailScreen key={detail[1]} planId={decodeURIComponent(detail[1])} onBack={() => navigate('/plans')} />;
  }

  if (path === '/plans') {
    return (
      <PlansScreen
        onAddInterest={startNewInterest}
        onOpenPlan={(plan) => openPlan(plan.id)}
      />
    );
  }

  return null;
}
