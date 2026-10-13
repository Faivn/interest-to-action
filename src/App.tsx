import { ToastProvider } from './components/Toast';
import type { TaskRepository } from './features/tasks/taskRepository';
import { TasksScreen } from './features/tasks/TasksScreen';

export function App({ repository }: { repository: TaskRepository }) {
  return (
    <ToastProvider>
      <main>
        <TasksScreen repository={repository} />
      </main>
    </ToastProvider>
  );
}
