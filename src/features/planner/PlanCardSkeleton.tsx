import { SkeletonBar } from '../../components/Skeleton';
import './PlanCard.css';

/** Same shell as a plan card, so suggestions arrive without layout shift (DESIGN.md §10.1). */
export function PlanCardSkeleton({ index }: { index: number }) {
  const delay = index * 120;
  return (
    <div className="plan-card plan-card--skeleton" aria-hidden="true">
      <div className="plan-card__head">
        <SkeletonBar width={48} height={10} delayMs={delay} />
      </div>
      <SkeletonBar width="58%" height={14} delayMs={delay} />
      <span className="plan-card__bridge" style={{ opacity: 0.35 }} />
      <SkeletonBar width={36} height={10} delayMs={delay} />
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        <SkeletonBar width="88%" height={18} delayMs={delay} />
        <SkeletonBar width="54%" height={18} delayMs={delay} />
      </div>
      <div style={{ marginTop: 16 }}>
        <SkeletonBar width={64} height={24} radius="var(--radius-full)" delayMs={delay} />
      </div>
    </div>
  );
}
