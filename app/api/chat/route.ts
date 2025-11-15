import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatHistoryItem = { role: "user" | "assistant"; content: string };
type SystemContext = {
  userSummary?: {
    totalTasks?: number;
    completed?: number;
    overdue?: number;
    upcomingDue?: Array<{ id: string; title: string; dueDate: string }>;
    focusAreas?: string[];
  };
  app?: {
    name?: string;
    version?: string;
    features?: string[];
    components?: string[];
  };
  backend?: {
    type?: "laravel" | "node" | "other";
    apiBaseUrl?: string;
    resources?: string[];
  };
};

export async function POST(request: Request) {
  try {
    const { prompt, context, history }: { prompt?: unknown; context?: SystemContext; history?: ChatHistoryItem[] } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are IntelliFlow's embedded AI assistant.
Context:
- Product: IntelliFlow – AI-powered task management (tasks, subtasks, priorities, deadlines, analytics).
- Frontend: Next.js + React + Tailwind.
- Backend: REST API (Laravel/Node) and/or Firebase Firestore for persistence.
- Goal: Provide precise, actionable, and safe guidance tailored to this system.

Guidelines:
- Be concise. Prefer bullet points with step-by-step actions.
- When advising changes in code, specify exact files and minimal diffs.
- When suggesting tasks or plans, use the existing Priority and Status models.
- If dates are involved, surface near-term deadlines first and call out overdue items.
- If uncertain about live data, clearly state assumptions and offer verification steps.
`;

    const contextBlock = context
      ? `\nSystem Context (JSON):\n${JSON.stringify(context)}`
      : "";

    // Basic history threading: include last few turns inline
    const historyBlock = Array.isArray(history) && history.length
      ? `\nRecent Conversation:\n${history
          .slice(-6)
          .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
          .join("\n")}`
      : "";

    const composed = `${systemPrompt}${contextBlock}${historyBlock}\n\nUSER: ${prompt}`;

    const result = await model.generateContent(composed);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
