"use client";
import { useState } from "react";
import type { Task, Priority, Status, Subtask } from "@/types/task";
import { suggestTaskStructure } from "@/lib/ai";

const priorities: Priority[] = ["low", "medium", "high", "urgent"];
const statuses: Status[] = ["todo", "in_progress", "blocked", "done"];

export function TaskForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Task>;
  onSubmit: (data: Partial<Task>) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [status, setStatus] = useState<Status>(initial?.status ?? "todo");
  const [dueDate, setDueDate] = useState<string>(initial?.dueDate ?? "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(initial?.subtasks ?? []);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    if (!title) {
      setError("Enter a title before suggesting subtasks.");
      return;
    }
    setError(null);
    setLoadingAI(true);
    try {
      const resp = await suggestTaskStructure({ title, description });
      const suggested: Subtask[] = resp.subtasks.map((s) => ({
        id: crypto.randomUUID(),
        title: s.title,
        completed: false,
      }));
      setSubtasks((prev) => (prev.length ? prev : suggested));
      if (resp.priority) setPriority(resp.priority);
      if (resp.dueDateHint && !dueDate) {
        console.info("Due date hint:", resp.dueDateHint);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get suggestions");
    } finally {
      setLoadingAI(false);
    }
  }

  function addSubtask() {
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: "", completed: false }]);
  }
  function updateSubtask(id: string, title: string) {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }
  function removeSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      priority,
      status,
      dueDate: dueDate || undefined,
      subtasks,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <label className="text-sm text-gray-300">Title</label>
        <input
          className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Prepare Q4 report"
          required
        />
      </div>
      <div>
        <label className="text-sm text-gray-300">Description</label>
        <textarea
          className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does success look like?"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-gray-300">Priority</label>
          <select
            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300">Status</label>
          <select
            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300">Due Date</label>
          <input
            type="date"
            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Subtasks</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loadingAI}
              className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-white disabled:opacity-60"
            >
              {loadingAI ? "Suggesting..." : "Suggest Subtasks"}
            </button>
            <button
              type="button"
              onClick={addSubtask}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
            >
              + Add Subtask
            </button>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          {subtasks.map((s) => (
            <div key={s.id} className="flex gap-2">
              <input
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                value={s.title}
                onChange={(e) => updateSubtask(s.id, e.target.value)}
                placeholder="Subtask title"
              />
              <button
                type="button"
                onClick={() => removeSubtask(s.id)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {subtasks.length === 0 && (
            <p className="text-xs text-gray-400">No subtasks yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Task"}
        </button>
      </div>
    </form>
  );
}