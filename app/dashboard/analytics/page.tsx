"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Award,
  Activity,
  Filter,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  dueDate: string | null;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  streak: number;
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    avgCompletionTime: 0,
    streak: 0,
  });
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
  }, []);

  // Load tasks from Firestore
  useEffect(() => {
    if (!user) return;

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
            status: data.status,
            priority: data.priority,
            category: data.category,
            dueDate: data.dueDate,
            createdAt: data.createdAt,
            completedAt: data.completedAt,
          });
        });
        setTasks(taskList);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Calculate statistics
  useEffect(() => {
    if (tasks.length === 0) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter tasks by time range
    let filteredTasks = tasks;
    if (timeRange === "week") {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTasks = tasks.filter(
        (t) => t.createdAt && t.createdAt.toDate() >= weekAgo
      );
    } else if (timeRange === "month") {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTasks = tasks.filter(
        (t) => t.createdAt && t.createdAt.toDate() >= monthAgo
      );
    }

    const completed = filteredTasks.filter((t) => t.status === "completed");
    const pending = filteredTasks.filter((t) => t.status !== "completed");
    const overdue = pending.filter(
      (t) => t.dueDate && new Date(t.dueDate) < today
    );

    // Calculate completion rate
    const completionRate =
      filteredTasks.length > 0
        ? (completed.length / filteredTasks.length) * 100
        : 0;

    // Calculate average completion time (in days)
    let totalCompletionTime = 0;
    let completedWithTime = 0;

    completed.forEach((task) => {
      if (task.createdAt && task.completedAt) {
        const created = task.createdAt.toDate();
        const completedDate = task.completedAt.toDate();
        const diffDays = Math.ceil(
          (completedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalCompletionTime += diffDays;
        completedWithTime++;
      }
    });

    const avgCompletionTime =
      completedWithTime > 0 ? totalCompletionTime / completedWithTime : 0;

    // Calculate streak (consecutive days with completed tasks)
    const streak = calculateStreak(tasks);

    setStats({
      totalTasks: filteredTasks.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      overdueTasks: overdue.length,
      completionRate: Math.round(completionRate),
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      streak,
    });
  }, [tasks, timeRange]);

  const calculateStreak = (tasks: Task[]): number => {
    const completed = tasks
      .filter((t) => t.status === "completed" && t.completedAt)
      .sort((a, b) => {
        const aDate = a.completedAt?.toDate().getTime() || 0;
        const bDate = b.completedAt?.toDate().getTime() || 0;
        return bDate - aDate;
      });

    if (completed.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < completed.length; i++) {
      const taskDate = completed[i].completedAt?.toDate();
      if (!taskDate) continue;

      taskDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today.getTime() - streak * 24 * 60 * 60 * 1000);

      if (taskDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (taskDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  // Get tasks by category
  const getTasksByCategory = () => {
    const categories: { [key: string]: number } = {};
    tasks.forEach((task) => {
      categories[task.category] = (categories[task.category] || 0) + 1;
    });
    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get tasks by priority
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

  // Get completion trend (last 7 days)
  const getCompletionTrend = () => {
    const trend: { day: string; completed: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const completedCount = tasks.filter((task) => {
        if (!task.completedAt) return false;
        const completedDate = task.completedAt.toDate();
        return completedDate >= dayStart && completedDate < dayEnd;
      }).length;

      trend.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        completed: completedCount,
      });
    }

    return trend;
  };

  const categoryData = getTasksByCategory();
  const priorityData = getTasksByPriority();
  const completionTrend = getCompletionTrend();
  const maxTrendValue = Math.max(...completionTrend.map((d) => d.completed), 1);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Analytics
            </h1>
            <p className="text-sm text-gray-400">
              Track your productivity metrics
            </p>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              timeRange === "week"
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              timeRange === "month"
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              timeRange === "all"
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Tasks */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalTasks}
          </div>
          <div className="text-sm text-gray-400">Total Tasks</div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.completedTasks}
          </div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.completionRate}%
          </div>
          <div className="text-sm text-gray-400">Completion Rate</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Pending Tasks */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{stats.pendingTasks}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{stats.overdueTasks}</div>
            <div className="text-xs text-gray-400">Overdue</div>
          </div>
        </div>

        {/* Avg Completion Time */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {stats.avgCompletionTime}d
            </div>
            <div className="text-xs text-gray-400">Avg Time</div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
            <Award className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{stats.streak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Completion Trend */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            7-Day Completion Trend
          </h3>
          <div className="space-y-3">
            {completionTrend.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-8">{item.day}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{
                      width: `${(item.completed / maxTrendValue) * 100}%`,
                    }}
                  >
                    {item.completed > 0 && (
                      <span className="text-xs font-semibold text-white">
                        {item.completed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            Tasks by Category
          </h3>
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet</p>
              </div>
            ) : (
              categoryData.map((item, idx) => {
                const colors = [
                  "from-blue-500 to-cyan-400",
                  "from-purple-500 to-pink-400",
                  "from-orange-500 to-red-400",
                  "from-green-500 to-emerald-400",
                  "from-yellow-500 to-amber-400",
                ];
                const maxCount = Math.max(...categoryData.map((c) => c.count), 1);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20 capitalize truncate">
                      {item.name}
                    </span>
                    <div className="flex-1 bg-gray-700 rounded-full h-8 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${
                          colors[idx % colors.length]
                        } h-full rounded-full flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-red-400" />
          Pending Tasks by Priority
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">
              {priorityData.urgent}
            </div>
            <div className="text-xs text-gray-400 uppercase">Urgent</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {priorityData.high}
            </div>
            <div className="text-xs text-gray-400 uppercase">High</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {priorityData.medium}
            </div>
            <div className="text-xs text-gray-400 uppercase">Medium</div>
          </div>
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-400 mb-1">
              {priorityData.low}
            </div>
            <div className="text-xs text-gray-400 uppercase">Low</div>
          </div>
        </div>
      </div>
    </div>
  );
}