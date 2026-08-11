import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, model = "gpt-5.4-nano" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Extracted document text is required" }, { status: 400 });
    }

    const apiKey = process.env.PUTER_API_KEY || process.env.OPENAI_API_KEY;

    // Puter REST API or AI fallback synthesis
    const prompt = `Convert the following extracted document text into clean, structured Markdown. Retain key headings, lists, bullet points, and main technical concepts:\n\n${text}`;

    let markdown = "";

    if (apiKey) {
      const res = await fetch("https://api.puter.com/v2/ai/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, model }),
      });
      const data = await res.json();
      markdown = data?.message?.content || data?.result || "";
    }

    // Fallback if API key is not yet set or returns empty
    if (!markdown) {
      const sanitized = text
        .split("\n")
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => (line.startsWith("---") ? line : `- ${line}`))
        .join("\n");
      markdown = `# Extracted Study Guide\n\n${sanitized}`;
    }

    return NextResponse.json({ markdown, modelUsed: model });
  } catch (err: any) {
    console.error("Error in /api/ai/markdown:", err);
    return NextResponse.json({ error: err.message || "Failed to process Markdown on server" }, { status: 500 });
  }
}
