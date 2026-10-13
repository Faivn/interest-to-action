import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { IconButton } from '../../components/IconButton';
import { formatRelativeDay } from '../../lib/dates';
import { prefersReducedMotion } from '../../lib/motion';
import { formatDuration, type Task } from './types';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

/** "Done today", "Added yesterday", "Done Monday", "Added 12 Oct". */
function dayPhrase(prefix: string, iso: string): string {
  const day = formatRelativeDay(iso);
  return `${prefix} ${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day}`;
}

/** Lets the check draw and sparkle play before an active task leaves the list. */
const COMPLETE_DELAY_MS = 420;

export function TaskItem({ task, index, onToggle, onEdit, onDelete }: TaskItemProps) {
  const metaId = useId();
  const [completing, setCompleting] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const done = task.status === 'completed' || completing;
  const duration = formatDuration(task.durationMinutes);

  const toggle = () => {
    if (completing) return;
    if (task.status === 'completed' || prefersReducedMotion()) {
      onToggle(task);
      return;
    }
    setCompleting(true);
    timer.current = window.setTimeout(() => onToggle(task), COMPLETE_DELAY_MS);
  };

  return (
    <li
      className={['task', done && 'task--done', completing && 'task--completing'].filter(Boolean).join(' ')}
      style={{ '--i': Math.min(index, 8) } as CSSProperties}
      data-task-id={task.id}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark “${task.title}” as done`}
        className="task__check"
        onClick={toggle}
      >
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <circle className="task__check-ring" cx="14" cy="14" r="12" />
          <path className="task__check-mark" d="M8.5 14.5l3.8 3.8 7.4-8" pathLength={1} />
        </svg>
        <span className="task__burst" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} style={{ '--n': i } as CSSProperties} />
          ))}
        </span>
      </button>

      <button
        type="button"
        className="task__main"
        aria-label={`Edit “${task.title}”`}
        aria-describedby={metaId}
        onClick={() => onEdit(task)}
      >
        <span className="task__title t-body-strong">{task.title}</span>
        <span id={metaId} className="task__meta t-caption">
          {task.status === 'completed' && task.completedAt ? (
            <span>{dayPhrase('Done', task.completedAt)}</span>
          ) : (
            <>
              {task.when && <span className="task__when">{task.when}</span>}
              {duration && (
                <span className="task__duration">
                  <Clock aria-hidden="true" size={14} />
                  {duration}
                </span>
              )}
              {!task.when && !duration && <span>{dayPhrase('Added', task.createdAt)}</span>}
            </>
          )}
        </span>
      </button>

      <IconButton
        className="task__delete"
        label={`Delete “${task.title}”`}
        icon={<Trash2 />}
        tone="danger"
        onClick={() => onDelete(task)}
      />
    </li>
  );
}
