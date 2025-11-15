import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_API_KEY on server" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const messages: Array<{ role: "user" | "model"; content: string }> =
      body?.messages || [];

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUser?.content?.toString() || "";
    if (!userText.trim()) {
      return new Response(
        JSON.stringify({ error: "Empty prompt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 1️⃣ List models your key can access
    const list = await genAI.listModels?.();
    const allModels = Array.isArray(list?.models) ? list.models : [];

    // 2️⃣ Filter models that support generateContent
    const generateModels = allModels.filter((m: any) =>
      m.supportedGenerationMethods?.includes("generateContent")
    );

    if (!generateModels.length) {
      return new Response(
        JSON.stringify({ error: "No available models support generateContent" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3️⃣ Pick the first supported model
    const activeModelName = generateModels[0].name;

    // 4️⃣ Start chat with history
    const model = genAI.getGenerativeModel({ model: activeModelName });
    const history = messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userText);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ model: activeModelName, text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
