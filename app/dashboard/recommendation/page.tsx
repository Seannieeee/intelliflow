"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  AlertTriangle, 
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  Loader2,
  Brain
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Timestamp 
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

interface AIRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  task?: Task;
  action?: string;
  icon: any;
  color: string;
  confidence?: number;
}

export default function AIRecommendations() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
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
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate,
          category: data.category,
          status: data.status,
          createdAt: data.createdAt,
        });
      });
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, [user]);

  // Analyze tasks when they change
  useEffect(() => {
    if (tasks.length === 0) {
      setRecommendations([]);
      return;
    }
    analyzeTasks();
  }, [tasks]);

  const analyzeTasks = () => {
    setAnalyzing(true);
    
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    const smartRecommendations = generateSmartRecommendations(pendingTasks);
    setRecommendations(smartRecommendations);
    
    setAnalyzing(false);
  };

  const generateSmartRecommendations = (pendingTasks: Task[]): AIRecommendation[] => {
    const recs: AIRecommendation[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Priority order: urgent, high, medium, low
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      return aPriority - bPriority;
    });

    // Generate smart analysis
    const urgentCount = sortedTasks.filter(t => t.priority === 'urgent').length;
    const highCount = sortedTasks.filter(t => t.priority === 'high').length;
    const overdueTasks = sortedTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < today
    );
    const todayTasks = sortedTasks.filter(t => 
      t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()
    );

    let analysisText = "";
    if (overdueTasks.length > 0) {
      analysisText += `⚠️ You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. `;
    }
    if (urgentCount > 0) {
      analysisText += `🚨 ${urgentCount} urgent task${urgentCount > 1 ? 's' : ''} need immediate focus. `;
    }
    if (todayTasks.length > 0) {
      analysisText += `📅 ${todayTasks.length} task${todayTasks.length > 1 ? 's are' : ' is'} due today. `;
    }
    if (analysisText === "") {
      analysisText = "✅ Your task load is manageable. Keep up the great work!";
    }

    // Calculate overall confidence based on urgency factors
    const totalTasks = sortedTasks.length;
    const urgentFactor = (urgentCount / Math.max(totalTasks, 1)) * 30;
    const overdueFactor = (overdueTasks.length / Math.max(totalTasks, 1)) * 40;
    const todayFactor = (todayTasks.length / Math.max(totalTasks, 1)) * 20;
    const analysisConfidence = Math.min(100, Math.max(60, 70 + urgentFactor + overdueFactor + todayFactor));

    // Add analysis insight at the top
    recs.push({
      id: "analysis-insight",
      type: "analysis_insight",
      title: "📊 Task Analysis",
      description: analysisText.trim(),
      icon: Brain,
      color: "purple",
      confidence: Math.round(analysisConfidence),
    });

    // 1. URGENT tasks (highest priority)
    const urgentTasks = sortedTasks.filter(t => t.priority === "urgent");
    urgentTasks.forEach(task => {
      const isOverdue = task.dueDate && new Date(task.dueDate) < today;
      
      // Calculate confidence: base 90%, +10% if overdue
      let confidence = 90;
      if (isOverdue) {
        const daysOverdue = Math.ceil((today.getTime() - new Date(task.dueDate!).getTime()) / 86400000);
        confidence = Math.min(99, 90 + Math.min(daysOverdue * 2, 9)); // Max 99%
      }
      
      recs.push({
        id: `urgent-${task.id}`,
        type: "urgent",
        title: isOverdue ? "🚨 URGENT: Overdue Task!" : "🚨 URGENT: Immediate Action Required",
        description: `"${task.title}" needs immediate attention${isOverdue ? ' and is overdue' : ''}`,
        task: task,
        action: "Do Now",
        icon: AlertTriangle,
        color: "red",
        confidence: Math.round(confidence),
      });
    });

    // 2. HIGH priority tasks
    const highTasks = sortedTasks.filter(t => t.priority === "high");
    highTasks.forEach(task => {
      const isOverdue = task.dueDate && new Date(task.dueDate) < today;
      const isToday = task.dueDate && new Date(task.dueDate).toDateString() === today.toDateString();
      
      recs.push({
        id: `high-${task.id}`,
        type: isOverdue ? "overdue" : isToday ? "today" : "high_priority",
        title: isOverdue 
          ? "⏰ High Priority Task Overdue" 
          : isToday 
            ? "📅 High Priority Due Today"
            : "⚡ High Priority Task",
        description: `"${task.title}"${isOverdue ? ' is past its due date' : isToday ? ' is due today' : ' should be addressed soon'}`,
        task: task,
        action: isOverdue ? "Complete Now" : isToday ? "Start Today" : "Prioritize",
        icon: isOverdue ? Clock : isToday ? Calendar : Target,
        color: isOverdue ? "orange" : isToday ? "yellow" : "blue",
        confidence: isOverdue ? 95 : isToday ? 92 : 85,
      });
    });

    // 3. MEDIUM priority tasks (only if due soon or overdue)
    const mediumTasks = sortedTasks.filter(t => t.priority === "medium");
    mediumTasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
        const isOverdue = dueDate < today;
        const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

        if (isOverdue || isDueSoon) {
          recs.push({
            id: `medium-${task.id}`,
            type: isOverdue ? "overdue" : "today",
            title: isOverdue 
              ? "⚠️ Medium Priority Overdue"
              : `📌 Medium Priority Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
            description: `"${task.title}"${isOverdue ? ' is past due' : ` is due ${daysUntilDue === 0 ? 'today' : 'soon'}`}`,
            task: task,
            action: isOverdue ? "Complete" : "Plan",
            icon: isOverdue ? Clock : Calendar,
            color: isOverdue ? "orange" : "teal",
            confidence: isOverdue ? 80 : 70,
          });
        }
      }
    });

    // 4. Productivity insights
    if (recs.length > 0) {
      const urgentCount = urgentTasks.length;
      const highCount = highTasks.length;
      
      if (urgentCount + highCount >= 3) {
        recs.push({
          id: "insight-workload",
          type: "insight",
          title: "📊 High Workload Detected",
          description: `You have ${urgentCount + highCount} urgent/high priority tasks. Consider delegating or rescheduling lower priorities.`,
          icon: TrendingUp,
          color: "green",
          confidence: 88,
        });
      }
    }

    return recs.slice(0, 8); // Limit to 8 recommendations
  };

  const getColorClasses = (color: string) => {
    const colors: any = {
      red: "bg-red-500/20 border-red-500/30 text-red-400",
      orange: "bg-orange-500/20 border-orange-500/30 text-orange-400",
      blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
      purple: "bg-purple-500/20 border-purple-500/30 text-purple-400",
      green: "bg-green-500/20 border-green-500/30 text-green-400",
      yellow: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
      teal: "bg-teal-500/20 border-teal-500/30 text-teal-400",
    };
    return colors[color] || colors.blue;
  };

  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            {analyzing ? (
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            ) : (
              <Brain className="w-5 h-5 text-purple-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Recommendations
              {analyzing && (
                <span className="text-xs text-purple-400 font-normal">Analyzing...</span>
              )}
            </h3>
            <p className="text-xs text-gray-400">
              {recommendations.length} insights
            </p>
          </div>
        </div>
        {recommendations.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAll ? "Show Less" : `+${recommendations.length - 3} More`}
          </button>
        )}
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 && !analyzing ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="text-gray-400 text-sm">
            {tasks.length === 0 
              ? "Create tasks to get recommendations" 
              : "All caught up! No urgent recommendations at this time."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedRecommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <div
                key={rec.id}
                className={`border rounded-lg p-4 ${getColorClasses(rec.color)} transition-all hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    rec.color === 'red' ? 'bg-red-500/30' :
                    rec.color === 'orange' ? 'bg-orange-500/30' :
                    rec.color === 'blue' ? 'bg-blue-500/30' :
                    rec.color === 'purple' ? 'bg-purple-500/30' :
                    rec.color === 'green' ? 'bg-green-500/30' :
                    rec.color === 'yellow' ? 'bg-yellow-500/30' :
                    'bg-teal-500/30'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white text-sm">
                        {rec.title}
                      </h4>
                      {rec.confidence && (
                        <span className="text-xs opacity-60">
                          {rec.confidence}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-90 mb-2">
                      {rec.description}
                    </p>
                    {rec.task && (
                      <div className="flex items-center gap-2 text-xs opacity-75 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-black/20 rounded capitalize">
                          {rec.task.category}
                        </span>
                        <span className={`px-2 py-0.5 bg-black/20 rounded uppercase font-semibold ${
                          rec.task.priority === 'urgent' ? 'text-red-300' :
                          rec.task.priority === 'high' ? 'text-orange-300' :
                          rec.task.priority === 'medium' ? 'text-blue-300' :
                          'text-purple-300'
                        }`}>
                          {rec.task.priority}
                        </span>
                        {rec.task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(rec.task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {rec.action && (
                    <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
                      {rec.action}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}