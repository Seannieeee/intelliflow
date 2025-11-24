"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  ChevronRight,
  Zap,
  CheckCircle2,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import AIRecommendations from './recommendation/page';

interface ActivityItem {
  id: string;
  action: string;
  type: string;
  timestamp: Timestamp | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  dueDate: string | null;
  createdAt: Timestamp;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  category: string;
}

export default function DashboardPage() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    category: "personal",
  });

  useEffect(() => {
    // Listen to auth state changes to ensure we get the user
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Load tasks from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("createdBy", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        taskList.push({
          id: doc.id,
          title: data.title,
          status: data.status,
          priority: data.priority,
          category: data.category,
          dueDate: data.dueDate,
          createdAt: data.createdAt,
        });
      });
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, [user]);

  // Load recent activity from Firestore - FIXED to filter by user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "activity"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities: ActivityItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          action: data.action,
          type: data.type,
          timestamp: data.timestamp
        });
      });
      setRecentActivity(activities);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

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
    } catch (error: any) {
      console.error("Error saving activity:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (!user) return;

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        category: taskForm.category,
        status: "pending",
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email,
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "tasks"), taskData);
      await addActivity(`Created task "${taskForm.title}"`, "create");
      
      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        category: "personal",
      });
      
      setShowTaskModal(false);
      alert("Task created successfully!");
    } catch (error: any) {
      console.error("Error creating task:", error);
      alert(`Failed to create task: ${error.message}`);
    }
  };

  const formatTimeAgo = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Just now";
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return "Just now";
    }
  };

  // Get user display name with better fallback
  const getUserDisplayName = () => {
    if (!user) return "Guest";
    
    // Try display name first
    if (user.displayName) {
      return user.displayName.split(" ")[0]; // First name only
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split("@")[0];
    }
    
    return "User";
  };

  const userName = getUserDisplayName();

  // Calculate real metrics from tasks
  const pendingTasks = tasks.filter(t => t.status !== "completed").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completedThisWeek = tasks.filter(t => {
    if (t.status !== "completed" || !t.createdAt) return false;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return t.createdAt.toDate() >= weekAgo;
  }).length;

  const quickActions = [
    { icon: Plus, label: "Create New Task", color: "bg-blue-500", action: () => setShowTaskModal(true) },
  ];

  const keyMetrics = [
    { icon: Zap, label: "Pending Tasks", value: pendingTasks.toString(), change: "", trend: "neutral" },
    { icon: CheckCircle2, label: "Completed Tasks", value: completedTasks.toString(), change: `+${completedThisWeek} this week`, trend: "up" },
  ];

  // Simple analytics for dashboard
  const getTasksByPriority = () => {
    const priorities: { [key: string]: number } = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    tasks.forEach((task) => {
      if (task.status !== "completed") {
        priorities[task.priority] = (priorities[task.priority] || 0) + 1;
      }
    });
    return priorities;
  };

  const priorityData = getTasksByPriority();
  const totalPending = Object.values(priorityData).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Create New Task</h3>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="project">Project</option>
                    <option value="urgent">Urgent</option>
                    <option value="routine">Daily Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            You have{" "}
            <span className="font-semibold text-blue-400">
              {pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'} pending
            </span>
            . Let's get productive!
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {keyMetrics.map((metric, idx) => (
              <div key={idx} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:shadow-lg hover:shadow-black/20 transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${
                    metric.trend === 'up' ? 'bg-green-500/20' : 
                    metric.trend === 'down' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  } rounded-lg flex items-center justify-center`}>
                    <metric.icon className={`w-5 h-5 ${
                      metric.trend === 'up' ? 'text-green-400' : 
                      metric.trend === 'down' ? 'text-red-400' : 'text-blue-400'
                    }`} />
                  </div>
                  {metric.change !== "" && (
                    <span className={`text-xs font-semibold ${
                      metric.trend === 'up' ? 'text-green-400' : 
                      metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {metric.change}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-xs text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="flex items-center gap-4 p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-black/20 transition-all group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-200 text-sm">{action.label}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <Activity className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity yet</p>
                  <p className="text-sm mt-1">Create your first task to get started!</p>
                </div>
              ) : (
                recentActivity.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.type === 'create' ? 'bg-blue-500' :
                      item.type === 'complete' ? 'bg-green-500' :
                      item.type === 'update' ? 'bg-amber-500' :
                      item.type === 'start' ? 'bg-purple-500' :
                      'bg-pink-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{item.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recommendations & Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* AI Recommendations Component */}
          <AIRecommendations />
          
          {/* Simple Analytics */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Task Priority Overview</h3>
                <p className="text-xs text-gray-400">{totalPending} pending tasks</p>
              </div>
            </div>

            {totalPending === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All caught up!</p>
                <p className="text-sm mt-1">No pending tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priorityData.urgent > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-gray-300">Urgent</span>
                    </div>
                    <span className="text-lg font-bold text-red-400">{priorityData.urgent}</span>
                  </div>
                )}
                {priorityData.high > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-300">High</span>
                    </div>
                    <span className="text-lg font-bold text-orange-400">{priorityData.high}</span>
                  </div>
                )}
                {priorityData.medium > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">Medium</span>
                    </div>
                    <span className="text-lg font-bold text-blue-400">{priorityData.medium}</span>
                  </div>
                )}
                {priorityData.low > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Low</span>
                    </div>
                    <span className="text-lg font-bold text-gray-400">{priorityData.low}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
