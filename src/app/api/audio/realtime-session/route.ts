import { NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = await rateLimit(request, "audio-realtime-session", 8);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Příliš mnoho pokusů o připojení hlasu. Zkus to za chvíli." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Na serveru chybí OPENAI_API_KEY." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({})) as { context?: unknown };
    const context = typeof body.context === "string" ? body.context.slice(0, 12000) : "";
    const instructions = [
      "Jsi ChatSLADAI, hlasový AI asistent. Mluv přirozenou, přátelskou a srozumitelnou češtinou. Používej živou intonaci, přirozené tempo a krátké konverzační věty. Zníš jako přirozený hlasový asistent, ne jako hlasatel čtoucí text.",
      "Odpovídej stručněji a konverzačně, jako při skutečném hovoru. Přirozeně reaguj na emoce a tón uživatele, občas polož doplňující otázku, když to pomůže pokračovat v rozhovoru. Nečti nahlas markdown, nadpisy ani dlouhé seznamy, pokud o ně uživatel výslovně nepožádá.",
      "Nech uživatele domluvit, reaguj na jeho řeč a umožni přirozené přerušení vlastní odpovědi. Pokud nevíš, řekni to.",
      "Nepředstírej přístup k internetu, souborům ani funkcím, které v této hlasové relaci nejsou připojené.",
      context ? "Dosavadní kontext konverzace:\n" + context : "",
    ].filter(Boolean).join("\n\n");

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: "gpt-realtime-2.1",
          instructions,
          audio: {
            input: { transcription: { model: "gpt-4o-mini-transcribe", language: "cs" }, turn_detection: { type: "semantic_vad", eagerness: "medium", create_response: true, interrupt_response: true } },
            output: { voice: "marin" },
          },
        },
      }),
    });

    const data = await response.json() as { value?: string; error?: { message?: string } };
    if (!response.ok || typeof data.value !== "string") {
      console.error("ChatSLADAI realtime session error:", response.status, data.error?.message || "unknown");
      return NextResponse.json(
        { error: response.status === 401 || response.status === 403
          ? "OpenAI API klíč nemá přístup k Realtime hlasovému modelu."
          : response.status === 429
            ? "Realtime hlas narazil na limit nebo fakturaci OpenAI."
            : "OpenAI se nepodařilo připravit živou hlasovou relaci." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    return NextResponse.json({ client_secret: data.value });
  } catch (error) {
    console.error("ChatSLADAI realtime session error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Živý hlas se nepodařilo připravit." }, { status: 502 });
  }
}
