"use client";
import { Task } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";

export function TaskList({
  tasks,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  onToggleDone: (id: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  if (!tasks.length) {
    return (
      <div className="text-center text-gray-400 py-12">No tasks yet. Create your first task!</div>
    );
  }
  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          onToggleDone={onToggleDone}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}