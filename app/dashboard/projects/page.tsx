"use client";

import { useState, useEffect } from "react";
import {
  FolderKanban,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Check,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  category: string;
  status: string;
  createdAt: Timestamp;
}

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load tasks from Firestore
  useEffect(() => {
    if (!user) {
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("createdBy", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taskList: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          taskList.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            priority: data.priority,
            dueDate: data.dueDate,
            category: data.category,
            status: data.status,
            createdAt: data.createdAt,
          });
        });
        // Sort manually by createdAt
        taskList.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        setTasks(taskList);
      },
      (error) => {
        console.error("Error loading tasks:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addActivity = async (action: string, type: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "activity"), {
        action,
        type,
        timestamp: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
      });
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      const taskRef = doc(db, "tasks", task.id);
      const newStatus = task.status === "completed" ? "pending" : "completed";
      
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await addActivity(
        newStatus === "completed" 
          ? `Completed task "${task.title}"` 
          : `Reopened task "${task.title}"`,
        newStatus === "completed" ? "complete" : "update"
      );
    } catch (error: any) {
      console.error("Error updating task:", error);
      alert(`Failed to update task: ${error.message}`);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteDoc(doc(db, "tasks", taskToDelete.id));
      await addActivity(`Deleted task "${taskToDelete.title}"`, "delete");
      setShowDeleteModal(false);
      setTaskToDelete(null);
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      alert(`Failed to delete task: ${error.message}`);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === "all" || task.category === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work": return "💼";
      case "personal": return "👤";
      case "project": return "📁";
      case "urgent": return "🚨";
      case "routine": return "🔄";
      default: return "📋";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatFullDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString("en-US", { 
        month: "long", 
        day: "numeric", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "N/A";
    }
  };

  const categories = [
    { value: "all", label: "All Tasks", count: tasks.length },
    { value: "personal", label: "Personal", count: tasks.filter(t => t.category === "personal").length },
    { value: "work", label: "Work", count: tasks.filter(t => t.category === "work").length },
    { value: "project", label: "Project", count: tasks.filter(t => t.category === "project").length },
    { value: "urgent", label: "Urgent", count: tasks.filter(t => t.category === "urgent").length },
    { value: "routine", label: "Daily Routine", count: tasks.filter(t => t.category === "routine").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <>
      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoryIcon(selectedTask.category)}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedTask.title}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-2 ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                <div className="flex items-center gap-2">
                  {selectedTask.status === "completed" ? (
                    <span className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium">
                      ⏱ Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <p className="text-gray-200 bg-gray-900/50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <div className="px-3 py-2 bg-gray-700 rounded-lg text-gray-200 capitalize">
                    {selectedTask.category}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Due Date</label>
                  <div className="px-3 py-2 bg-gray-700 rounded-lg text-gray-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(selectedTask.dueDate)}
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Created</label>
                <div className="px-3 py-2 bg-gray-700 rounded-lg text-gray-200 text-sm">
                  {formatFullDate(selectedTask.createdAt)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleCompleteTask(selectedTask)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    selectedTask.status === "completed"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {selectedTask.status === "completed" ? "Mark as Pending" : "Mark as Complete"}
                </button>
                <button
                  onClick={() => {
                    setTaskToDelete(selectedTask);
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Task</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">"{taskToDelete.title}"</span>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Tasks</h1>
              <p className="text-sm text-gray-400">Manage and organize your tasks</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  filter === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {cat.label}
                <span className="ml-2 text-xs opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {tasks.filter(t => t.status === "pending").length}
              </span>
            </div>
            <p className="text-sm text-gray-400">Pending Tasks</p>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {tasks.filter(t => t.status === "completed").length}
              </span>
            </div>
            <p className="text-sm text-gray-400">Completed</p>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {tasks.filter(t => t.priority === "urgent" || t.priority === "high").length}
              </span>
            </div>
            <p className="text-sm text-gray-400">High Priority</p>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">No tasks found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? "Try a different search term" : "Create your first task to get started"}
              </p>
              {!searchQuery && tasks.length === 0 && (
                <p className="text-sm text-gray-500">
                  Go to the Dashboard to create a new task
                </p>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`bg-gray-800 rounded-xl border p-5 transition-all cursor-pointer ${
                  task.status === "completed" 
                    ? "border-green-500/30 opacity-75 hover:opacity-100" 
                    : "border-gray-700 hover:border-blue-500/50"
                } group`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{getCategoryIcon(task.category)}</span>
                      <h3 className={`text-lg font-semibold group-hover:text-blue-400 transition-colors ${
                        task.status === "completed" ? "text-gray-400 line-through" : "text-white"
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.status === "completed" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ Done
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 bg-gray-700 rounded text-gray-300 capitalize">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}