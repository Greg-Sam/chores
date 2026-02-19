export interface User {
  _id: string;
  name: string;
}

export interface ChoreHistoryEntry {
  completedAt: string;
  completedBy: string | User;
}

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type ChoreStatus = 'active' | 'queued';

export interface Chore {
  _id: string;
  name: string;
  description: string;
  frequency: Frequency;
  assignedTo: User | null;
  status: ChoreStatus;
  dueDate: string;
  completedDate: string | null;
  history: ChoreHistoryEntry[];
}
