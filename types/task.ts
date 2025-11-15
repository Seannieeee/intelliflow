export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "todo" | "in_progress" | "blocked" | "done";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  dueDate?: string; // ISO 8601
  subtasks: Subtask[];
  tags?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  completedAt?: string; // ISO
  estimateMinutes?: number;
  actualMinutes?: number;
}
