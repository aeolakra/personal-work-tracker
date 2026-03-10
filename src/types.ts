export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TaskStatus;
  workDate: string | null;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
  orderIndex?: number;
}

export const CATEGORIES = [
  'Design',
  'Presentation',
  'Admin',
  'Development',
  'Personal',
  'College',
  'Other',
];
