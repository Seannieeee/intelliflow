"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  RefreshCw,
  Sparkles,
  Loader2,
  User,
  AlertCircle,
} from "lucide-react";

// TypeScript declarations for Puter.js
declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (messages: any[]) => Promise<any>;
      };
    };
  }
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Puter.js on component mount
  useEffect(() => {
    const loadPuterScript = () => {
      // Check if already loaded
      if (window.puter && window.puter.ai) {
        setPuterReady(true);
        console.log("✅ Puter.js AI ready");
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(
        'script[src="https://js.puter.com/v2/"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          setPuterReady(true);
          console.log("✅ Puter.js loaded");
        });
        return;
      }

      // Load script
      const script = document.createElement("script");
      script.src = "https://js.puter.com/v2/";
      script.async = true;

      script.onload = () => {
        setPuterReady(true);
        console.log("✅ Puter.js loaded successfully");
      };

      script.onerror = () => {
        console.error("❌ Failed to load Puter.js");
        setError("Failed to load AI service. Please refresh the page.");
      };

      document.head.appendChild(script);
    };

    loadPuterScript();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (puterReady && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! 👋 I'm your AI task assistant powered by advanced language models.

I can help you with:
✅ **Task Management** - Planning, prioritizing, and organizing tasks
📝 **Productivity Tips** - Strategies to boost your efficiency
🎯 **Goal Setting** - Breaking down big goals into actionable steps
💡 **Problem Solving** - Creative solutions to challenges
📊 **Decision Making** - Weighing options and making informed choices

What would you like help with today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [puterReady, messages.length]);

  /**
   * Send message to AI assistant
   */
  const sendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      if (!puterReady || !window.puter?.ai) {
        throw new Error("AI service is not available");
      }

      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // System prompt for task assistant
      const systemPrompt = `You are a helpful, friendly AI task assistant. You help users with:
- Task management and organization
- Productivity and time management advice  
- Breaking down complex projects into steps
- Goal setting and planning
- Problem-solving and decision making

Provide practical, actionable advice. Be concise but thorough. Use bullet points and formatting for clarity when helpful.`;

      // Prepare messages for AI
      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: content },
      ];

      // Call Puter.js AI
      const aiResponse = await window.puter.ai.chat(aiMessages);

      // Parse response
      let responseText = "";
      if (typeof aiResponse === "string") {
        responseText = aiResponse;
      } else if (aiResponse?.message) {
        responseText =
          typeof aiResponse.message === "string"
            ? aiResponse.message
            : aiResponse.message.content || JSON.stringify(aiResponse.message);
      } else if (aiResponse?.content) {
        responseText = aiResponse.content;
      } else if (aiResponse?.text) {
        responseText = aiResponse.text;
      } else {
        responseText = aiResponse?.toString() || "I received your message but couldn't generate a response.";
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI chat error:", error);
      setError("Failed to get AI response. Please try again.");

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear conversation
   */
  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              AI Assistant
            </h1>
            <p className="text-sm text-gray-400">
              Your intelligent task assistant
            </p>
          </div>
        </div>

        {/* Status & Clear Button */}
        <div className="flex items-center gap-2">
          {puterReady ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 hidden sm:inline">
                AI Online
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
              <span className="text-xs text-yellow-400 hidden sm:inline">
                Loading...
              </span>
            </div>
          )}

          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && puterReady && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to assist!
              </h3>
              <p className="text-gray-400 text-sm max-w-md">
                Start a conversation by typing a message below. I'm here to help
                with your tasks and productivity.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-blue-500/20"
                    : "bg-purple-500/20"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-blue-400" />
                ) : (
                  <Bot className="w-4 h-4 text-purple-400" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-[80%] ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "bg-gray-700/50 border border-gray-600/30"
                  }`}
                >
                  <p className="text-sm text-white whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                puterReady
                  ? "Type your message..."
                  : "Loading AI assistant..."
              }
              disabled={!puterReady || isLoading}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!puterReady || isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Powered by Puter.js AI • Responses are generated by AI and may not
        always be accurate
      </div>
    </div>
  );
}