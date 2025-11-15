"use client";

import { useState, useRef } from "react";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      // Abort after 60s to avoid hanging requests
      timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      });
      if (!res.ok) {
        let errMsg = "";
        try {
          const errData = await res.json();
          errMsg = errData?.error || "";
        } catch {
          try {
            errMsg = await res.text();
          } catch {
            /* ignore */
          }
        }
        throw new Error(errMsg || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const replyText = (data && typeof data.text === "string" ? data.text : "").trim();
      const reply: ChatMessage = { role: "model", content: replyText || "…" };
      setMessages((m) => [...m, reply]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      setMessages((m) => [
        ...m,
        { role: "model", content: `Sorry, I hit an error: ${msg}` },
      ]);
    } finally {
      // clear abort timeout if set
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
      queueMicrotask(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>AI Assistant</h1>
      <div
        ref={listRef}
        style={{
          marginTop: 16,
          height: "60vh",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 12,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#6b7280" }}>Ask me anything to get started.</div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: m.role === "user" ? "#2563eb" : "white",
                  color: m.role === "user" ? "white" : "#111827",
                  border: m.role === "user" ? "none" : "1px solid #e5e7eb",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ color: "#6b7280", fontStyle: "italic" }}>Thinking…</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message…"
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "10px 12px",
            outline: "none",
          }}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding: "10px 14px",
            background: "#2563eb",
            color: "white",
            borderRadius: 8,
            border: 0,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </main>
  );
}
