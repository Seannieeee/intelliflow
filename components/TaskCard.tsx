"use client";
import { CheckCircle2, Clock, Flag, MoreVertical } from "lucide-react";
import type { Task } from "@/types/task";

function priorityColor(p: Task["priority"]) {
  switch (p) {
    case "urgent":
      return "text-red-300 border-red-400/30";
    case "high":
      return "text-orange-300 border-orange-400/30";
    case "medium":
      return "text-yellow-300 border-yellow-400/30";
    default:
      return "text-green-300 border-green-400/30";
  }
}

export function TaskCard({
  task,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggleDone: (id: string, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const done = task.status === "done";
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
      <button
        onClick={() => onToggleDone(task.id, !done)}
        className={`mt-1 ${done ? "text-green-400" : "text-gray-500 hover:text-gray-300"}`}
        title={done ? "Mark as todo" : "Mark as done"}
      >
        <CheckCircle2 className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h4 className={`font-semibold text-white ${done ? "line-through text-gray-400" : ""}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-gray-300 mt-1">{task.description}</p>
            )}
            {task.subtasks?.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs border px-2 py-0.5 rounded ${priorityColor(task.priority)}`}
              title="Priority"
            >
              <Flag className="w-3 h-3 inline mr-1" />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="text-xs text-gray-400" title="Due date">
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-gray-700" title="Edit">
              <MoreVertical className="w-4 h-4 text-gray-300" />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-gray-700" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}