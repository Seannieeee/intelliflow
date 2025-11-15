"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Bot,
  FolderKanban,
  BarChart3,
  Plug,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication
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

  const getActiveNav = () => {
    if (pathname === "/dashboard") return "home";
    if (pathname === "/dashboard/projects") return "projects";
    if (pathname === "/dashboard/assistant") return "assistant";
    if (pathname === "/dashboard/analytics") return "analytics";
    return "home";
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  // Get user display name with better fallback
  const getUserDisplayName = () => {
    if (!user) return "Guest";
    
    // Try display name first
    if (user.displayName) {
      return user.displayName;
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split("@")[0];
    }
    
    return "User";
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    
    // If it's a multi-word name, get first letter of first two words
    const words = displayName.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    
    // Otherwise, get first two letters
    return displayName.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-500 text-lg">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const userName = getUserDisplayName();
  const userInitials = getUserInitials();
  const activeNav = getActiveNav();

  const navigationItems = [
    { id: "home", icon: Home, label: "Home", path: "/dashboard" },
    { id: "assistant", icon: Bot, label: "AI Assistant", path: "/dashboard/assistant" },
    { id: "projects", icon: FolderKanban, label: "Projects", path: "/dashboard/projects" },
    { id: "analytics", icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  ];

  return (
    <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 flex flex-col fixed lg:relative h-full z-30`}
      >
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

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeNav === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

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

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
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
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-gray-200">{userName}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
              <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold hover:shadow-lg transition-shadow">
                {userInitials}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}