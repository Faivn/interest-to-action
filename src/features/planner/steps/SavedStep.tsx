import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { PlanSentence } from '../../plans/PlanSentence';
import type { SavedPlan } from '../../plans/types';
import './steps.css';

interface SavedStepProps {
  plan: SavedPlan;
  onViewPlans: () => void;
  onAddAnother: () => void;
}

/** docs/design.md §4.7 — a quiet, typographic confirmation (no confetti). */
export function SavedStep({ plan, onViewPlans, onAddAnother }: SavedStepProps) {
  return (
    <Screen
      topBar={null}
      actions={
        <>
          <Button fullWidth onClick={onViewPlans}>
            View my plans
          </Button>
          <Button variant="text" onClick={onAddAnother}>
            Add another interest
          </Button>
        </>
      }
    >
      <div className="saved">
        <svg className="saved__check" viewBox="0 0 72 72" aria-hidden="true">
          <defs>
            {/* A soft daybreak halo around the check (DESIGN.md §4, §9) */}
            <radialGradient id="saved-halo">
              <stop offset="0.45" style={{ stopColor: 'var(--daybreak-2)', stopOpacity: 0.85 }} />
              <stop offset="0.75" style={{ stopColor: 'var(--daybreak-1)', stopOpacity: 0.5 }} />
              <stop offset="1" style={{ stopColor: 'var(--daybreak-1)', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          <circle className="saved__halo" cx="36" cy="36" r="36" fill="url(#saved-halo)" />
          <circle className="saved__disc" cx="36" cy="36" r="24" />
          <path className="saved__tick" d="M25 36.5l7.5 7.5L47.5 29" pathLength={1} />
        </svg>
        <h1 className="t-title-1 saved__title">
          Plan saved. <span className="saved__title-soft">Your next step is ready.</span>
        </h1>
        <section className="saved__plan" aria-label="Your plan">
          <p className="t-interest saved__interest">{plan.interest}</p>
          {/* Streams in after the check draws and the headline settles (DESIGN.md §11.2). */}
          <PlanSentence plan={plan} className="t-plan-action" stream={{ startMs: 520 }} />
        </section>
        <p className="t-callout saved__note">You'll find it in My plans, where you can mark progress or change it anytime.</p>
      </div>
    </Screen>
  );
}
