import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.HF_API_KEY;
    console.log("HF API KEY EXISTS:", !!apiKey);

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log("🔥 Sending request to HuggingFace Router...");

    const response = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-2", // free model
        messages: [{ role: "user", content: message }],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    console.log("HF STATUS:", response.status);

    let data: any = null;
    try {
      data = await response.json();
      console.log("HF DATA:", JSON.stringify(data).substring(0, 300));
    } catch {
      console.log("HF RAW DATA: (not JSON)");
    }

    if (!response.ok) {
      const errMsg = data?.error?.message || data?.error || `HF API error ${response.status}`;
      return NextResponse.json({ error: `HF API Error: ${errMsg}` }, { status: response.status });
    }

    const aiResponse = data?.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error("CHAT ROUTE ERROR:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
