import { NextResponse } from "next/server";

export async function GET() {
  const defaultModels = [
    { id: "gpt-5.4-nano", name: "GPT 5.4 Nano (Free / Server)" },
    { id: "google/gemini-3.6-flash", name: "Gemini 3.6 Flash (Free / Server)" },
    { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5 (Paid / Server)" },
  ];

  return NextResponse.json({ models: defaultModels });
}
