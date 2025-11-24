import { ArrowRight, MessageSquare, ListChecks, BarChart3, Sparkles, Bot, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <main className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        {/* Logo Section */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/50 mb-4 relative">
            <Bot className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Task Management</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Work Smarter with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              IntelliFlow
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Chat with Gemini AI, manage tasks effortlessly, and visualize your productivity—all in one intelligent platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <a
              href="/register"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 w-full sm:w-auto hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800/80 backdrop-blur border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 w-full sm:w-auto"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full">
          {/* Feature 1 - AI Chat */}
          <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur border border-gray-700 rounded-2xl hover:bg-gray-800/70 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl mb-4 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all">
              <MessageSquare className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Gemini AI Chat</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Get instant answers and intelligent suggestions from Google's Gemini AI assistant.
            </p>
          </div>

          {/* Feature 2 - Task Management */}
          <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur border border-gray-700 rounded-2xl hover:bg-gray-800/70 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl mb-4 group-hover:from-purple-500/30 group-hover:to-purple-600/20 transition-all">
              <ListChecks className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Task Management</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create, organize, and track tasks with an intuitive interface designed for productivity.
            </p>
          </div>

          {/* Feature 3 - Analytics */}
          <div className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-800/30 backdrop-blur border border-gray-700 rounded-2xl hover:bg-gray-800/70 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-xl mb-4 group-hover:from-indigo-500/30 group-hover:to-indigo-600/20 transition-all">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Visualize your progress with powerful analytics and gain insights into your workflow.
            </p>
          </div>
        </div>

        {/* Secondary Features */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Smart Automation</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
