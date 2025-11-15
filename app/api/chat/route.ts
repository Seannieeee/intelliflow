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
    const body = await request.json();
    const { prompt, context, history } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are IntelliFlow's embedded AI assistant...`;

    const contextBlock = context ? `\nSystem Context:\n${JSON.stringify(context)}` : "";
    const historyBlock = Array.isArray(history)
      ? `\nRecent Conversation:\n${history
          .slice(-6)
          .map((h: any) => `${h.role.toUpperCase()}: ${h.content}`)
          .join("\n")}`
      : "";

    const composed = `${systemPrompt}${contextBlock}${historyBlock}\n\nUSER: ${prompt}`;

    const result = await model.generateContent(composed);
    const text = result.response.text().replace(/```[\s\S]*?```/g, "").trim();

    return NextResponse.json({ text });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
