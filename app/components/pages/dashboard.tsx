"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Bot,
  FolderKanban,
  BarChart3,
  Plug,
  Settings,
  LogOut,
  Plus,
  Clock,
  Upload,
  Search,
  Menu,
  X,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function IntelliFlowDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Changed to false for mobile-first
  const [activeNav, setActiveNav] = useState("home");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  // ✅ Check authentication on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-500 text-lg">
        Loading dashboard...
      </div>
    );
  }

  if (!user) return null;

  const userName = user.displayName || "User";
  const pendingTasks = 3;

  const navigationItems = [
    { id: "home", icon: Home, label: "Home", active: true },
    { id: "assistant", icon: Bot, label: "AI Assistant", active: false, badge: "Soon" },
    { id: "projects", icon: FolderKanban, label: "Projects", active: true },
    { id: "analytics", icon: BarChart3, label: "Analytics", active: false, badge: "Soon" },
    { id: "integrations", icon: Plug, label: "Integrations", active: false, badge: "Soon" },
    { id: "settings", icon: Settings, label: "Settings", active: true },
  ];

  const quickActions = [
    { icon: Plus, label: "Create New Task", color: "bg-blue-500", active: true },
    { icon: Clock, label: "View Recent Activity", color: "bg-teal-500", active: true },
    { icon: Upload, label: "Upload Data", color: "bg-indigo-500", active: true },
  ];

  const recentActivity = [
    { action: 'Created project "Q4 Marketing Plan"', time: "2 hours ago", type: "create" },
    { action: 'Completed task "Design mockups"', time: "5 hours ago", type: "complete" },
    { action: "Updated workflow automation rules", time: "1 day ago", type: "update" },
    { action: "Invited team member Sarah Chen", time: "2 days ago", type: "team" },
    { action: 'Started workflow "Email Campaign"', time: "3 days ago", type: "start" },
  ];

  const activeProjects = [
    { name: "Q4 Marketing Plan", status: "In Progress", progress: 65, color: "bg-blue-500" },
    { name: "Website Redesign", status: "Review", progress: 85, color: "bg-green-500" },
    { name: "Product Launch", status: "Planning", progress: 30, color: "bg-purple-500" },
  ];

  const todayAgenda = [
    { time: "10:00 AM", task: "Team standup meeting", type: "meeting" },
    { time: "2:00 PM", task: "Review design mockups", type: "review" },
    { time: "4:30 PM", task: "Client presentation", type: "presentation" },
  ];

  const keyMetrics = [
    { icon: Zap, label: "Active Workflows", value: "12", change: "+3", trend: "up" },
    { icon: CheckCircle2, label: "Completed Tasks", value: "47", change: "+8", trend: "up" },
  ];

  const placeholderCards = [
    { icon: Bot, label: "AI Recommendations", value: "—", sublabel: "AI-powered insights coming soon" },
    { icon: BarChart3, label: "Advanced Analytics", value: "—", sublabel: "Deep insights in Sprint 2" },
  ];

  return (
    <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 flex flex-col fixed lg:relative h-full z-30`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">IntelliFlow</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.active) {
                  setActiveNav(item.id);
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }
              }}
              disabled={!item.active}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeNav === item.id
                  ? "bg-blue-600 text-white"
                  : item.active
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 cursor-not-allowed"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">
                {item.label}
              </span>
              {item.badge && (
                <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Logout</h3>
                <p className="text-sm text-gray-400">Are you sure you want to sign out?</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors mr-2"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
            <Search className="w-5 h-5 text-gray-500 hidden sm:block" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 outline-none text-sm bg-transparent text-gray-200 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-gray-200">{userName}</div>
                <div className="text-xs text-gray-400">Product Manager</div>
              </div>
              <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold hover:shadow-lg transition-shadow">
                {userName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome back, {userName.split(" ")[0]} 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              You have{" "}
              <span className="font-semibold text-blue-400">
                {pendingTasks} tasks pending
              </span>
              . Let's get productive!
            </p>
          </div>

          {/* Key Metrics - Central Hub Overview */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Performance Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {keyMetrics.map((metric, idx) => (
                <div key={idx} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:shadow-lg hover:shadow-black/20 transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 ${
                      metric.trend === 'up' ? 'bg-green-500/20' : 
                      metric.trend === 'down' ? 'bg-red-500/20' : 'bg-gray-700'
                    } rounded-lg flex items-center justify-center`}>
                      <metric.icon className={`w-5 h-5 ${
                        metric.trend === 'up' ? 'text-green-400' : 
                        metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                      }`} />
                    </div>
                    {metric.change !== "0" && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
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
                {recentActivity.slice(0, 4).map((item, idx) => (
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
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Features Placeholder Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {placeholderCards.map((card, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-gray-700">
                    <card.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-base font-semibold text-white">{card.label}</span>
                </div>
                <div className="text-4xl font-bold text-gray-600 mb-2">{card.value}</div>
                <p className="text-sm text-gray-400">{card.sublabel}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="h-auto sm:h-12 bg-gray-800 border-t border-gray-700 px-4 sm:px-8 py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2 sm:gap-0 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <a href="#" className="hover:text-blue-400 transition-colors">Help & Support</a>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
          </div>
          <div className="text-gray-500">
            IntelliFlow <span className="font-semibold">v0.3</span> Beta
          </div>
        </footer>
      </main>
    </div>
  );
}
