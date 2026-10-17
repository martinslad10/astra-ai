import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";

type Prediction = { id?: string; status?: string; output?: unknown; error?: unknown };

export async function POST(request: Request) {
  const limit = rateLimit(request, "video-create", 2);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Příliš mnoho požadavků. Zkus to znovu později." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  const token = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_VIDEO_MODEL;
  if (!token || !model) {
    return NextResponse.json({ error: "Video generování není nakonfigurované. Na serveru nastav REPLICATE_API_TOKEN a REPLICATE_VIDEO_MODEL (owner/model)." }, { status: 503 });
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 10_000) return NextResponse.json({ error: "Požadavek je příliš velký." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Neplatný JSON požadavek." }, { status: 400 }); }
    if (!body || typeof body !== "object" || !("prompt" in body) || typeof body.prompt !== "string") return NextResponse.json({ error: "Zadej popis videa." }, { status: 400 });
    const prompt = body.prompt.trim();
    if (!prompt || prompt.length > 3000) return NextResponse.json({ error: "Popis musí mít 1 až 3 000 znaků." }, { status: 400 });

    const response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=1" },
      body: JSON.stringify({ input: { prompt } }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json() as Prediction;
    if (!response.ok) {
      console.error("Astra AI video provider error:", response.status, data.error);
      return NextResponse.json({ error: "Video služba požadavek odmítla. Zkontroluj model, oprávnění a kredit u poskytovatele." }, { status: response.status === 429 ? 429 : 502 });
    }
    return NextResponse.json({ id: data.id, status: data.status, output: data.output ?? null, error: data.error ?? null });
  } catch (error) {
    console.error("Astra AI video create error:", error);
    return NextResponse.json({ error: "Video se nepodařilo spustit. Zkontroluj připojení a nastavení poskytovatele." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const limit = rateLimit(request, "video-poll", 20);
  if (!limit.allowed) return NextResponse.json({ error: "Příliš mnoho kontrol stavu. Zkus to za chvíli." }, { status: 429 });
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Chybí REPLICATE_API_TOKEN." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9_-]{8,100}$/.test(id)) return NextResponse.json({ error: "Neplatné ID generování." }, { status: 400 });
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const data = await response.json() as Prediction;
    if (!response.ok) return NextResponse.json({ error: "Stav generování se nepodařilo načíst." }, { status: response.status === 429 ? 429 : 502 });
    return NextResponse.json({ id: data.id, status: data.status, output: data.output ?? null, error: data.error ?? null });
  } catch (error) {
    console.error("Astra AI video poll error:", error);
    return NextResponse.json({ error: "Nepodařilo se načíst stav videa." }, { status: 502 });
  }
}
