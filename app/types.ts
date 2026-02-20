export interface User {
  _id: string;
  name: string;
}

export interface ChoreHistoryEntry {
  completedAt: string;
  completedBy: string | User;
}

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export interface Chore {
  _id: string;
  name: string;
  description: string;
  frequency: Frequency;
  assignedTo: User | null;
  dueDate: string;
  completedDate: string | null;
  history: ChoreHistoryEntry[];
}
