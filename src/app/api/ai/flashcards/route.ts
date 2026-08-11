import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { markdown, model = "gpt-5.4-nano" } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: "Markdown content is required" }, { status: 400 });
    }

    const apiKey = process.env.PUTER_API_KEY || process.env.OPENAI_API_KEY;

    const prompt = `Generate a comprehensive set of flashcards from the following Markdown study guide.
Return ONLY valid JSON in the exact structure:
[
  { "front": "Question or term", "back": "Answer or explanation", "tags": ["topic"] }
]

Markdown content:
${markdown}`;

    let cards: Array<{ front: string; back: string; tags?: string[] }> = [];

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
      let rawText = data?.message?.content || data?.result || "";
      rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        cards = JSON.parse(match[0]);
      }
    }

    // Fallback card generator if API key is not set yet
    if (cards.length === 0) {
      const lines = markdown.split("\n").filter((l: string) => l.trim().length > 5);
      cards = lines.slice(0, 10).map((line: string, i: number) => ({
        front: `Key Concept #${i + 1}`,
        back: line.replace(/^[-#*]\s*/, ""),
        tags: ["Study Guide"],
      }));
    }

    return NextResponse.json({ cards, modelUsed: model });
  } catch (err: any) {
    console.error("Error in /api/ai/flashcards:", err);
    return NextResponse.json({ error: err.message || "Failed to generate flashcards on server" }, { status: 500 });
  }
}
