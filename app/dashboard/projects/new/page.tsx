"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import type { Task } from "@/types/task";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function NewTaskPage() {
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleSubmit(data: Partial<Task>) {
    if (!user || !(auth.currentUser?.uid)) {
      alert("Please sign in to create tasks.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tasks"), {
        title: data.title,
        description: data.description ?? "",
        priority: data.priority ?? "medium",
        status: data.status ?? "todo",
        dueDate: data.dueDate ?? null,
        subtasks: data.subtasks ?? [],
        tags: data.tags ?? [],
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push("/dashboard/projects");
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Create Task</h1>
      <p className="text-sm text-gray-400 mb-6">
        Use AI to suggest subtasks and priority based on your title and description.
      </p>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <TaskForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}