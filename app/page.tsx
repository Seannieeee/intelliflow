import Image from "next/image";
import { ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <main className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        {/* Logo Section */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/50 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Next.js + Firebase Powered</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              IntelliFlow
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your intelligent workflow management platform. Streamline your projects with powerful automation and real-time collaboration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <a
              href="/register"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 w-full sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-300 w-full sm:w-auto"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full">
          {/* Feature 1 */}
          <div className="group p-6 bg-gray-800/50 border border-gray-700 rounded-2xl hover:bg-gray-800 transition-all duration-300 hover:border-blue-500/50">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-400 text-sm">
              Built with Next.js 15 for optimal performance and seamless user experience.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 bg-gray-800/50 border border-gray-700 rounded-2xl hover:bg-gray-800 transition-all duration-300 hover:border-purple-500/50">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl mb-4 group-hover:bg-purple-500/20 transition-colors">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Reliable</h3>
            <p className="text-gray-400 text-sm">
              Firebase authentication ensures your data is protected with enterprise-grade security.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 bg-gray-800/50 border border-gray-700 rounded-2xl hover:bg-gray-800 transition-all duration-300 hover:border-pink-500/50">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-500/10 rounded-xl mb-4 group-hover:bg-pink-500/20 transition-colors">
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Features</h3>
            <p className="text-gray-400 text-sm">
              Intelligent automation and AI-powered insights to boost your productivity.
            </p>
          </div>
        </div>


      </main>
    </div>
  );
}