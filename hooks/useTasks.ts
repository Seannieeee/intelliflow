"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { Task } from "@/types/task";

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Task[]>(
        projectId ? `/projects/${projectId}/tasks` : `/tasks`
      );
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(async (payload: Partial<Task>) => {
    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
      title: payload.title ?? "Untitled",
      description: payload.description ?? "",
      priority: payload.priority ?? "medium",
      status: payload.status ?? "todo",
      dueDate: payload.dueDate,
      subtasks: payload.subtasks ?? [],
      tags: payload.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const saved = await apiFetch<Task>("/tasks", { method: "POST", body: payload });
      setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? saved : t)));
      return saved;
    } catch (e) {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      throw e;
    }
  }, []);

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const before = tasks;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)));
      try {
        const updated = await apiFetch<Task>(`/tasks/${id}`, { method: "PATCH", body: patch });
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (e) {
        setTasks(before);
        throw e;
      }
    },
    [tasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const before = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await apiFetch<void>(`/tasks/${id}`, { method: "DELETE" });
      } catch (e) {
        setTasks(before);
        throw e;
      }
    },
    [tasks]
  );

  return { tasks, loading, error, reload: load, createTask, updateTask, deleteTask };
}