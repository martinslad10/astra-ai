import OpenAI from "openai";
import { NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const limit = await rateLimit(request, "audio-speech", 20);
  if (!limit.allowed) return NextResponse.json({ error: "Příliš mnoho hlasových odpovědí. Zkus to za chvíli." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });
    const body = await request.json() as { text?: unknown };
    if (typeof body.text !== "string" || !body.text.trim()) return NextResponse.json({ error: "Chybí text k přečtení." }, { status: 400 });
    if (body.text.length > 8000) return NextResponse.json({ error: "Text je příliš dlouhý pro jednu hlasovou odpověď." }, { status: 413 });
    const client = new OpenAI({ apiKey });
    const audio = await client.audio.speech.create({ model: "gpt-4o-mini-tts", voice: "alloy", input: body.text, instructions: "Mluv přirozenou, klidnou češtinou. Vyslovuj srozumitelně a přátelsky." });
    const bytes = Buffer.from(await audio.arrayBuffer());
    return new NextResponse(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : 500;
    console.error("ChatSLADAI speech error:", error instanceof Error ? error.message.slice(0, 300) : "unknown");
    return NextResponse.json({ error: status === 401 || status === 403 ? "OpenAI odmítlo API klíč nebo oprávnění k hlasu." : status === 429 ? "Hlasový výstup narazil na limit nebo fakturaci." : "Hlasovou odpověď se nepodařilo vytvořit." }, { status: status === 401 || status === 403 || status === 429 ? status : 502 });
  }
}
