import OpenAI from "openai";
import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(request, "code", 5);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Příliš mnoho požadavků. Zkus to znovu za chvíli." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 20_000) return NextResponse.json({ error: "Zadání je příliš dlouhé." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Neplatný JSON požadavek." }, { status: 400 }); }
    if (!body || typeof body !== "object" || !("task" in body) || typeof body.task !== "string") {
      return NextResponse.json({ error: "Popiš, co má kód dělat." }, { status: 400 });
    }

    const task = body.task.trim();
    const language = "language" in body && typeof body.language === "string" ? body.language.slice(0, 80) : "TypeScript";
    const context = "context" in body && typeof body.context === "string" ? body.context.slice(0, 5000) : "";
    if (!task || task.length > 6000) return NextResponse.json({ error: "Zadání musí mít 1 až 6 000 znaků." }, { status: 400 });

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: "Jsi zkušený softwarový inženýr v Astra AI. Odpovídej jazykem uživatele. Vytvářej čitelný, udržovatelný a bezpečný kód. Nikdy netvrď, že jsi kód spustil nebo otestoval, pokud se tak skutečně nestalo. Uveď stručné vysvětlení, celý kód a konkrétní kroky ověření. Nepoužívej nebezpečné příkazy ani nevkládej tajné klíče. Pokud zadání neobsahuje dost detailů, napiš rozumné předpoklady.",
      input: `Úkol: ${task}\nPreferovaný jazyk/framework: ${language}\nKontext existujícího projektu (nepovinný):\n${context || "Není zadán"}\n\nVrať odpověď ve struktuře: Návrh řešení, implementace s úplnými kódovými bloky a postup ověření. U více souborů jasně označ cestu každého souboru.`,
      max_output_tokens: 4000,
    });
    return NextResponse.json({ result: response.output_text || "Nepodařilo se vytvořit návrh kódu." });
  } catch (error) {
    console.error("Astra AI code error:", error);
    return NextResponse.json({ error: "Kód se nepodařilo vygenerovat. Zkontroluj konfiguraci AI modelu." }, { status: 500 });
  }
}
