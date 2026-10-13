import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { ChipGroup } from '../../components/ChipGroup';
import { Sheet } from '../../components/Sheet';
import { TextField } from '../../components/TextField';
import { DURATION_OPTIONS, EMPTY_DRAFT, type TaskDraft } from './types';
import './TaskFormSheet.css';

export const TITLE_MAX_LENGTH = 140;

interface TaskFormSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialDraft?: TaskDraft;
  onSubmit: (draft: TaskDraft) => void;
  onClose: () => void;
  /** Edit mode only. */
  onDelete?: () => void;
}

/** Shared create / edit form for a task, presented in a Sheet. */
export function TaskFormSheet({ open, mode, initialDraft = EMPTY_DRAFT, onSubmit, onClose, onDelete }: TaskFormSheetProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<TaskDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);

  // Start from the provided values each time the sheet opens (not on every parent render).
  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
      setError(null);
    }
  }, [open]);

  const update = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === 'title' && error) setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.title.trim() === '') {
      setError('Add a task to continue.');
      titleRef.current?.focus();
      return;
    }
    onSubmit(draft);
  };

  const isEdit = mode === 'edit';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'Add a task'}
      description={isEdit ? undefined : 'Keep it small enough to start in one sitting.'}
      initialFocusRef={titleRef}
      footer={
        <>
          <Button type="submit" form={formId}>
            {isEdit ? 'Save changes' : 'Add task'}
          </Button>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          {isEdit && onDelete && (
            <Button variant="danger-text" className="task-form__delete" onClick={onDelete}>
              Delete task
            </Button>
          )}
        </>
      }
    >
      <form id={formId} className="task-form" onSubmit={submit} noValidate>
        <TextField
          label="What's the next step?"
          value={draft.title}
          onChange={(v) => update('title', v)}
          placeholder="e.g. Watch the first UI animation lesson"
          error={error}
          maxLength={TITLE_MAX_LENGTH}
          enterKeyHint="done"
          inputRef={titleRef}
        />
        <TextField
          label="When will you do it?"
          optional
          value={draft.when}
          onChange={(v) => update('when', v)}
          placeholder="e.g. After breakfast"
          helper="Tying it to something you already do makes it easier to start."
          maxLength={80}
          enterKeyHint="done"
        />
        <ChipGroup
          label="How long will it take?"
          optional
          options={DURATION_OPTIONS}
          value={draft.durationMinutes}
          onChange={(v) => update('durationMinutes', v)}
        />
      </form>
    </Sheet>
  );
}
