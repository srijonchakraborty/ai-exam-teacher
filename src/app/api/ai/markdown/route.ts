import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, model = "gpt-4o-mini" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Extracted document text is required" }, { status: 400 });
    }

    const apiKey = process.env.PUTER_API_KEY || process.env.OPENAI_API_KEY;

    const prompt = `Convert the following extracted document text into clean, structured Markdown. Retain key headings, lists, bullet points, and main technical concepts:\n\n${text}`;

    let markdown = "";

    if (apiKey) {
      const res = await fetch("https://api.puter.com/drivers/call", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interface: "puter-chat-completion",
          method: "complete",
          args: {
            messages: [{ role: "user", content: prompt }],
            model: model || "gpt-4o-mini",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        markdown = data?.result?.message?.content || data?.result?.text || "";
      }
    }

    // Fallback if key is missing or empty
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
