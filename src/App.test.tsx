import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createLocalTaskRepository, STORAGE_KEY } from './features/tasks/taskRepository';

function renderApp() {
  const user = userEvent.setup();
  const utils = render(<App repository={createLocalTaskRepository()} />);
  return { user, ...utils };
}

async function addTask(user: ReturnType<typeof userEvent.setup>, title: string, options: { when?: string; duration?: string } = {}) {
  await user.click(await screen.findByRole('button', { name: 'Add a task' }));
  const dialog = screen.getByRole('dialog', { name: 'Add a task' });
  await user.type(within(dialog).getByLabelText("What's the next step?"), title);
  if (options.when) await user.type(within(dialog).getByLabelText(/When will you do it/), options.when);
  if (options.duration) await user.click(within(dialog).getByRole('radio', { name: options.duration }));
  await user.click(within(dialog).getByRole('button', { name: 'Add task' }));
}

describe('Tasks', () => {
  it('shows a helpful empty state on first use', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: 'No tasks yet' })).toBeInTheDocument();
    expect(screen.getByText("Start with one thing you've been meaning to do.")).toBeInTheDocument();
  });

  it('validates an empty task without closing the sheet', async () => {
    const { user } = renderApp();
    await user.click(await screen.findByRole('button', { name: 'Add a task' }));
    const dialog = screen.getByRole('dialog', { name: 'Add a task' });
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Add a task to continue.');
    expect(within(dialog).getByLabelText("What's the next step?")).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates a task with optional details and confirms it', async () => {
    const { user } = renderApp();
    await addTask(user, 'Watch lesson one', { when: 'After breakfast', duration: '10 min' });

    const list = screen.getByRole('list', { name: 'Active tasks' });
    expect(within(list).getByText('Watch lesson one')).toBeInTheDocument();
    expect(within(list).getByText('After breakfast')).toBeInTheDocument();
    expect(within(list).getByText('10 min')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Task added.');
    expect(screen.getByText('1 to do · 0 done')).toBeInTheDocument();
  });

  it('edits a task', async () => {
    const { user } = renderApp();
    await addTask(user, 'Draft outline');
    await user.click(screen.getByRole('button', { name: 'Edit “Draft outline”' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit task' });
    const field = within(dialog).getByLabelText("What's the next step?");
    await user.clear(field);
    await user.type(field, 'Draft the intro');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('button', { name: 'Edit “Draft the intro”' })).toBeInTheDocument();
    expect(screen.queryByText('Draft outline')).not.toBeInTheDocument();
  });

  it('completes a task, shows it under Completed, and can undo', async () => {
    const { user } = renderApp();
    await addTask(user, 'Stretch for 5 minutes');
    await user.click(screen.getByRole('checkbox', { name: /Stretch for 5 minutes/ }));

    expect(await screen.findByRole('heading', { name: 'All clear' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Completed/ }));
    const done = screen.getByRole('list', { name: 'Completed tasks' });
    expect(within(done).getByRole('checkbox', { name: /Stretch/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(done).getByText('Done today')).toBeInTheDocument();

    // Reopen from the Completed view.
    await user.click(within(done).getByRole('checkbox', { name: /Stretch/ }));
    expect(await screen.findByRole('heading', { name: 'Nothing finished yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('list', { name: 'Completed tasks' })).toBeInTheDocument();
  });

  it('deletes a task and restores it with Undo', async () => {
    const { user } = renderApp();
    await addTask(user, 'First');
    await addTask(user, 'Second');
    await user.click(screen.getByRole('button', { name: 'Delete “First”' }));
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Task deleted.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    const items = within(screen.getByRole('list', { name: 'Active tasks' })).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([expect.stringContaining('Second'), expect.stringContaining('First')]);
  });

  it('persists tasks across reloads', async () => {
    const first = renderApp();
    await addTask(first.user, 'Survives a refresh');
    first.unmount();

    renderApp();
    expect(await screen.findByText('Survives a refresh')).toBeInTheDocument();
  });

  it('protects unreadable saved data and offers a retry', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{corrupt');
    renderApp();
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your saved tasks.");
    expect(screen.getByRole('button', { name: 'Add a task' })).toBeDisabled();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{corrupt');
  });
});
