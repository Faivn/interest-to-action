import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { InlineMessage } from '../../components/InlineMessage';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useToast } from '../../components/Toast';
import { useDelayedFlag } from '../../lib/useDelayedFlag';
import type { TaskRepository } from './taskRepository';
import { TaskFormSheet } from './TaskFormSheet';
import { TaskList } from './TaskList';
import { TaskListSkeleton } from './TaskListSkeleton';
import { selectActive, selectCompleted } from './tasksReducer';
import { draftFromTask, type Task, type TaskDraft } from './types';
import { useTasks } from './useTasks';
import './TasksScreen.css';

type View = 'active' | 'completed';

type SheetState = { mode: 'create' } | { mode: 'edit'; task: Task } | null;

/** After an undo the toast (and its focused button) disappears; land focus on the affected task. */
function focusTaskSoon(id: string) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-task-id="${CSS.escape(id)}"] .task__check`)?.focus();
  });
}

export function TasksScreen({ repository }: { repository: TaskRepository }) {
  const tasks = useTasks(repository);
  const toast = useToast();
  const panelId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<View>('active');
  const [sheet, setSheet] = useState<SheetState>(null);

  const active = useMemo(() => selectActive(tasks.tasks), [tasks.tasks]);
  const completed = useMemo(() => selectCompleted(tasks.tasks), [tasks.tasks]);
  const visible = view === 'active' ? active : completed;
  const ready = tasks.status === 'ready';
  const showSkeleton = useDelayedFlag(tasks.status === 'loading', 150);

  const { setCompleted, remove, restore } = tasks;

  const handleToggle = useCallback(
    (task: Task) => {
      const completing = task.status === 'active';
      setCompleted(task.id, completing);
      toast.show({
        tone: completing ? 'success' : 'neutral',
        message: completing ? 'Done. Nice work.' : 'Moved back to active.',
        actionLabel: 'Undo',
        onAction: () => {
          setCompleted(task.id, !completing);
          focusTaskSoon(task.id);
        },
      });
    },
    [setCompleted, toast],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      const removed = remove(task.id);
      setSheet(null);
      if (!removed) return;
      toast.show({
        message: 'Task deleted.',
        actionLabel: 'Undo',
        onAction: () => {
          restore(removed);
          focusTaskSoon(removed.task.id);
        },
      });
    },
    [remove, restore, toast],
  );

  const handleEdit = useCallback((task: Task) => setSheet({ mode: 'edit', task }), []);
  const focusAddButton = useCallback(() => addButtonRef.current?.focus(), []);

  const handleSubmit = (draft: TaskDraft) => {
    if (sheet?.mode === 'edit') {
      tasks.edit(sheet.task.id, draft);
      toast.show({ tone: 'success', message: 'Changes saved.' });
    } else {
      tasks.add(draft);
      setView('active');
      toast.show({ tone: 'success', message: 'Task added.' });
    }
    setSheet(null);
  };

  const summary = !ready
    ? null
    : tasks.tasks.length === 0
      ? 'Small steps, one at a time.'
      : `${active.length} to do · ${completed.length} done`;

  return (
    <div className="tasks-screen">
      <header className="tasks-screen__header">
        <div>
          <h1 className="t-display">My tasks</h1>
          <p className="t-callout tasks-screen__summary" aria-live="polite">
            {summary ?? ' '}
          </p>
        </div>
        <div className="tasks-screen__add">
          <Button
            ref={addButtonRef}
            icon={<Plus strokeWidth={2.25} />}
            fullWidth
            disabled={!ready}
            onClick={() => setSheet({ mode: 'create' })}
          >
            Add a task
          </Button>
        </div>
      </header>

      {tasks.saveFailed && (
        <InlineMessage
          tone="error"
          action={
            <Button variant="text" onClick={tasks.retrySave}>
              Try again
            </Button>
          }
        >
          Your latest changes aren't saved on this device yet. They're still here on screen.
        </InlineMessage>
      )}

      {tasks.status === 'error' ? (
        <InlineMessage
          tone="error"
          action={
            <Button variant="text" onClick={tasks.reload}>
              Try again
            </Button>
          }
        >
          We couldn't load your saved tasks. Nothing has been deleted.
        </InlineMessage>
      ) : (
        <>
          <SegmentedControl<View>
            label="Show tasks"
            controls={panelId}
            value={view}
            onChange={setView}
            segments={[
              { value: 'active', label: 'Active', count: ready ? active.length : undefined },
              { value: 'completed', label: 'Completed', count: ready ? completed.length : undefined },
            ]}
          />

          <section id={panelId} className="tasks-screen__panel" aria-busy={!ready || undefined}>
            {!ready ? (
              <>
                <span className="visually-hidden" role="status">
                  Loading your tasks…
                </span>
                {showSkeleton && <TaskListSkeleton />}
              </>
            ) : visible.length > 0 ? (
              <TaskList
                tasks={visible}
                label={view === 'active' ? 'Active tasks' : 'Completed tasks'}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onFocusLost={focusAddButton}
              />
            ) : (
              <TasksEmpty view={view} hasAny={tasks.tasks.length > 0} />
            )}
          </section>
        </>
      )}

      <TaskFormSheet
        open={sheet !== null}
        mode={sheet?.mode ?? 'create'}
        initialDraft={sheet?.mode === 'edit' ? draftFromTask(sheet.task) : undefined}
        onSubmit={handleSubmit}
        onClose={() => setSheet(null)}
        onDelete={sheet?.mode === 'edit' ? () => handleDelete(sheet.task) : undefined}
      />
    </div>
  );
}

function TasksEmpty({ view, hasAny }: { view: View; hasAny: boolean }) {
  if (view === 'completed') {
    return (
      <EmptyState title="Nothing finished yet" ghostRows={1}>
        Tasks you complete will gather here.
      </EmptyState>
    );
  }
  if (hasAny) {
    return (
      <EmptyState title="All clear" ghostRows={0}>
        Everything on your list is done. Add another step when you're ready.
      </EmptyState>
    );
  }
  return (
    <EmptyState title="No tasks yet">
      Start with one thing you've been meaning to do.
    </EmptyState>
  );
}
