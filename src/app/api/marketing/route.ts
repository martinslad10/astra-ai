import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM = `You are Astra AI's practical marketing strategist. Reply in Czech unless the user writes in another language. Make realistic, audience-specific marketing content. Never invent performance metrics, testimonials, customer results, or factual product claims. Clearly label assumptions. Provide actionable drafts that the user can edit; do not claim to publish or send anything.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 20_000) return NextResponse.json({ error: "Zadání je příliš dlouhé." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Neplatný JSON požadavek." }, { status: 400 }); }
    if (!body || typeof body !== "object" || !("business" in body) || typeof body.business !== "string") {
      return NextResponse.json({ error: "Popiš své podnikání nebo produkt." }, { status: 400 });
    }

    const business = body.business.trim();
    const platform = "platform" in body && typeof body.platform === "string" ? body.platform.slice(0, 40) : "Instagram";
    const goal = "goal" in body && typeof body.goal === "string" ? body.goal.slice(0, 120) : "Získat nové zákazníky";
    const audience = "audience" in body && typeof body.audience === "string" ? body.audience.slice(0, 500) : "Není specifikováno";
    if (!business || business.length > 5000) return NextResponse.json({ error: "Popis podnikání musí mít 1 až 5 000 znaků." }, { status: 400 });

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM,
      input: `Připrav marketingový balíček v češtině. Podnikání/produkt: ${business}\nPlatforma: ${platform}\nCíl: ${goal}\nCílová skupina: ${audience}\n\nVýstup strukturovaně: (1) stručný positioning a nabídka, (2) 3 rozdílné příspěvky s úvodním hookem, textem a CTA, (3) 3 nápady na krátká videa včetně záběrů a titulků, (4) 7denní plán publikování v tabulce, (5) 3 A/B testy a co měřit, (6) předpoklady a co ověřit. Nevymýšlej fakta o produktu; označ chybějící informace.`,
      max_output_tokens: 2500,
    });
    return NextResponse.json({ result: response.output_text || "Nepodařilo se vytvořit návrh." });
  } catch (error) {
    console.error("Astra AI marketing error:", error);
    return NextResponse.json({ error: "Marketingový návrh se nepodařilo vytvořit. Zkontroluj konfiguraci AI modelu." }, { status: 500 });
  }
}
