import { SkeletonBar } from '../../components/Skeleton';
import './TaskListSkeleton.css';

const ROWS = [
  { title: '62%', meta: '34%' },
  { title: '78%', meta: '24%' },
  { title: '50%', meta: '40%' },
];

/** Same shell as a task row, so content arrives without layout shift. */
export function TaskListSkeleton() {
  return (
    <div className="task-skeleton" aria-hidden="true">
      {ROWS.map((row, i) => (
        <div key={i} className="task-skeleton__row">
          <SkeletonBar width={28} height={28} radius="50%" delayMs={i * 120} />
          <div className="task-skeleton__text">
            <SkeletonBar width={row.title} height={14} delayMs={i * 120} />
            <SkeletonBar width={row.meta} height={10} delayMs={i * 120} />
          </div>
        </div>
      ))}
    </div>
  );
}
