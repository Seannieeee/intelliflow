"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, RefreshCw, Sparkles, Loader2, User, AlertCircle } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persisted history or set welcome message
  useEffect(() => {
    try {
      const stored = localStorage.getItem("assistantMessages");
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
          timestamp: string;
        }>;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
          );
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to restore messages", e);
    }
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! 👋 I'm your AI task assistant powered by Google Gemini.

I can help you with:
✅ Task Management – Planning, prioritizing, organizing tasks
📝 Productivity Tips – Strategies to boost efficiency
🎯 Goal Setting – Turning big goals into actionable steps
💡 Problem Solving – Creative approaches to challenges
📊 Decision Making – Weighing options effectively

What would you like help with today?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Persist messages on change
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const serializable = messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      }));
      localStorage.setItem(
        "assistantMessages",
        JSON.stringify(serializable)
      );
    } catch (e) {
      console.warn("Failed to persist messages", e);
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Send message to AI assistant
   */
  const sendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      // Add a placeholder assistant message while waiting for response
      const placeholderId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: placeholderId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: content,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMsg = errorData?.error || errorData?.message || `API error: ${res.status}`;
        throw new Error(errorMsg);
      }
      
      const data: { text?: string; error?: string } = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const responseText = data.text?.trim() || "I couldn't generate a response.";
      setMessages((prev) => prev.map((m) => (m.id === placeholderId ? { ...m, content: responseText } : m)));
    } catch (err) {
      console.error("AI response error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to get AI response";
      setError(errorMessage);
      
      // Remove the placeholder message if there was an error
      setMessages((prev) => prev.filter(m => m.content !== ""));
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
    try {
      localStorage.removeItem("assistantMessages");
    } catch {}
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 hidden sm:inline">Gemini Ready</span>
          </div>

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
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
            {error.includes("quota") && (
              <p className="text-red-200 text-xs mt-2">
                Tip: Wait a few seconds and try again, or check your API quota.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to assist!
              </h3>
              <p className="text-gray-400 text-sm max-w-md">
                Start a conversation by typing a message below. I&apos;m here to help with tasks and productivity.
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
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
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
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
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
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
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
        Powered by Google Gemini • Responses are generated by AI and may not always be accurate
      </div>
    </div>
  );
}