import { SkeletonBar } from '../../components/Skeleton';
import './PlanCard.css';

/** Same shell as the recommendation card, so the plan arrives without layout shift (DESIGN.md §10.1). */
export function PlanCardSkeleton() {
  return (
    <div className="plan-card plan-card--skeleton" aria-hidden="true">
      <div className="plan-card__head">
        <SkeletonBar width={84} height={20} radius="var(--radius-xs)" />
      </div>
      <div className="plan-card__body">
        <SkeletonBar width={44} height={10} />
        <div style={{ marginTop: 8 }}>
          <SkeletonBar width="58%" height={14} />
        </div>
        <span className="plan-card__bridge" style={{ opacity: 0.35 }} />
        <SkeletonBar width={32} height={10} />
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <SkeletonBar width="88%" height={18} />
          <SkeletonBar width="54%" height={18} />
        </div>
        <div style={{ marginTop: 16 }}>
          <SkeletonBar width={64} height={24} radius="var(--radius-full)" />
        </div>
      </div>
      <div className="plan-card__footer">
        <SkeletonBar width={64} height={12} />
        <SkeletonBar width={180} height={44} radius="var(--radius-full)" />
      </div>
    </div>
  );
}
