import { useLayoutEffect, useRef } from 'react';
import { TaskItem } from './TaskItem';
import type { Task } from './types';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  label: string;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Called when the list loses its last item while focus was inside it. */
  onFocusLost?: () => void;
}

export function TaskList({ tasks, label, onToggle, onEdit, onDelete, onFocusLost }: TaskListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const lastFocusedIndex = useRef<number | null>(null);

  // When a focused row leaves (completed or deleted), keep keyboard users in place
  // by moving focus to the row that took its position.
  useLayoutEffect(() => {
    const list = listRef.current;
    const index = lastFocusedIndex.current;
    if (index === null) return;
    const active = document.activeElement;
    if (active && active !== document.body && document.contains(active)) return;
    lastFocusedIndex.current = null;
    const rows = list?.querySelectorAll<HTMLLIElement>(':scope > li') ?? [];
    const row = rows[Math.min(index, rows.length - 1)];
    const target = row?.querySelector<HTMLElement>('.task__check');
    if (target) target.focus();
    else onFocusLost?.();
  }, [tasks, onFocusLost]);

  return (
    <ul
      ref={listRef}
      className="task-list"
      aria-label={label}
      onFocus={(event) => {
        const row = (event.target as HTMLElement).closest('li');
        if (!row || !listRef.current) return;
        lastFocusedIndex.current = Array.prototype.indexOf.call(listRef.current.children, row);
      }}
      onBlur={(event) => {
        // Focus moved somewhere else on purpose; stop tracking. (A removed row blurs with no relatedTarget.)
        const next = event.relatedTarget as Node | null;
        if (next && !listRef.current?.contains(next)) lastFocusedIndex.current = null;
      }}
    >
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
