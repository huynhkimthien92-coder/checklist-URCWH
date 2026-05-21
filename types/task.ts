export type Task = {
  id: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
  completedAt?: string;
};
