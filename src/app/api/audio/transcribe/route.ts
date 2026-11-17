import OpenAI, { toFile } from "openai";
import { NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const limit = await rateLimit(request, "audio-transcribe", 10);
  if (!limit.allowed) return NextResponse.json({ error: "Příliš mnoho hlasových požadavků. Zkus to za chvíli." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Chybí zvukový záznam." }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Zvukový záznam je příliš velký (limit 20 MB)." }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const audio = await toFile(bytes, file.name || "recording.webm", { type: file.type || "audio/webm" });
    const client = new OpenAI({ apiKey });
    const result = await client.audio.transcriptions.create({ file: audio, model: "gpt-4o-mini-transcribe", language: "cs" });
    return NextResponse.json({ text: result.text });
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : 500;
    console.error("ChatSLADAI transcription error:", error instanceof Error ? error.message.slice(0, 300) : "unknown");
    return NextResponse.json({ error: status === 401 || status === 403 ? "OpenAI odmítlo API klíč nebo oprávnění k přepisu." : status === 429 ? "Přepis hlasu narazil na limit nebo fakturaci." : "Hlas se nepodařilo přepsat. Zkus jiný záznam." }, { status: status === 401 || status === 403 || status === 429 ? status : 502 });
  }
}
