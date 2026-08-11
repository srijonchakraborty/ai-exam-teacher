"use client";

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<{ message: { content: string } } | string>;
        img2txt: (source: Blob | File | string, options?: { provider?: string; pages?: number[] }) => Promise<string>;
        listModels: () => Promise<Array<{ id: string; name: string; isFree?: boolean }>>;
      };
      auth: {
        signIn: () => Promise<void>;
        isSignedIn: () => boolean;
        getUser: () => Promise<{ username: string }>;
      };
    };
  }
}

export const DEFAULT_FREE_MODEL = "gpt-5.4-nano";

export async function ensurePuterAuth(): Promise<boolean> {
  if (typeof window === "undefined" || !window.puter) {
    console.warn("Puter.js script not loaded yet");
    return false;
  }
  if (!window.puter.auth.isSignedIn()) {
    try {
      await window.puter.auth.signIn();
    } catch (e) {
      console.error("Puter auth failed:", e);
      return false;
    }
  }
  return true;
}

export async function fetchAvailableModels(): Promise<Array<{ id: string; name: string }>> {
  const fallbackModels = [
    { id: "gpt-5.4-nano", name: "GPT 5.4 Nano (Free)" },
    { id: "google/gemini-3.6-flash", name: "Gemini 3.6 Flash (Free)" },
    { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5 (Paid)" },
  ];

  if (typeof window === "undefined" || !window.puter || !window.puter.ai.listModels) {
    return fallbackModels;
  }

  try {
    const models = await window.puter.ai.listModels();
    if (models && models.length > 0) {
      return models.map((m) => ({
        id: m.id,
        name: m.name || m.id,
      }));
    }
  } catch (err) {
    console.warn("Using fallback models due to error fetching models:", err);
  }

  return fallbackModels;
}

export async function generateMarkdownFromText(extractedText: string, model: string = DEFAULT_FREE_MODEL): Promise<string> {
  if (typeof window === "undefined" || !window.puter) {
    throw new Error("Puter.js client library is unavailable.");
  }
  await ensurePuterAuth();
  
  const prompt = `Convert the following extracted document text into clean, structured Markdown. Retain key headings, lists, bullet points, and main technical concepts:\n\n${extractedText}`;
  
  const response = await window.puter.ai.chat(prompt, { model });
  if (typeof response === "string") return response;
  return response?.message?.content || String(response);
}

export async function generateFlashcardsFromMarkdown(markdownContent: string, model: string = DEFAULT_FREE_MODEL): Promise<Array<{ front: string; back: string; tags?: string[] }>> {
  if (typeof window === "undefined" || !window.puter) {
    throw new Error("Puter.js client library is unavailable.");
  }
  await ensurePuterAuth();

  const prompt = `Generate a comprehensive set of flashcards from the following Markdown study guide.
Return ONLY valid JSON in the exact structure:
[
  { "front": "Question or term", "back": "Answer or explanation", "tags": ["topic"] }
]

Markdown content:
${markdownContent}`;

  const response = await window.puter.ai.chat(prompt, { model });
  let rawText = typeof response === "string" ? response : response?.message?.content || "";
  
  // Clean markdown code blocks if present (```json ... ```)
  rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(rawText);
  } catch (err) {
    console.error("Failed to parse flashcards JSON:", err, rawText);
    throw new Error("Could not parse AI response into flashcards JSON format.");
  }
}
