import { Task } from "@/types/task";

export type ProductivitySummary = {
  total: number;
  completed: number;
  completionRate: number; // 0..1
  overdue: number;
  avgCycleDays?: number;
};

export function summarizeProductivity(tasks: Task[], now = new Date()): ProductivitySummary {
  const total = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done");
  const completed = completedTasks.length;

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;
    if (t.status === "done") return false;
    return new Date(t.dueDate).getTime() < now.getTime();
  }).length;

  const cycles: number[] = [];
  for (const t of completedTasks) {
    if (t.completedAt) {
      const end = new Date(t.completedAt).getTime();
      const start = new Date(t.createdAt).getTime();
      cycles.push((end - start) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    total,
    completed,
    completionRate: total ? completed / total : 0,
    overdue,
    avgCycleDays: cycles.length
      ? Number((cycles.reduce((a, b) => a + b, 0) / cycles.length).toFixed(2))
      : undefined,
  };
}