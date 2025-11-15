import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type SuggestRequest = {
  title: string;
  description?: string;
  context?: { tags?: string[]; estimateMinutes?: number; dueDate?: string };
};

export async function POST(req: NextRequest) {
  try {
    const { title, description, context }: SuggestRequest = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const system = `You are an expert productivity assistant.
Return ONLY valid JSON with fields:
{
  "subtasks": [{"title": string}] ,
  "priority": "low"|"medium"|"high"|"urgent",
  "dueDateHint": string
}`;

    const user = `Task: ${title}
${description ? `Details: ${description}` : ""}
${context?.tags ? `Tags: ${context.tags.join(", ")}` : ""}
${context?.estimateMinutes ? `Estimate: ${context.estimateMinutes} minutes` : ""}
${context?.dueDate ? `User Due Date: ${context.dueDate}` : ""}`;

    const prompt = `${system}\n---\n${user}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStr = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
