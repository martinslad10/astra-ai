import OpenAI from "openai";
import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = rateLimit(request, "images", 3);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Příliš mnoho požadavků. Zkus to znovu za chvíli." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 12_000) {
      return NextResponse.json({ error: "Požadavek je příliš velký." }, { status: 413 });
    }
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Tělo požadavku není platný JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || !("prompt" in body) || typeof body.prompt !== "string") {
      return NextResponse.json({ error: "Zadej textový popis obrázku." }, { status: 400 });
    }
    const prompt = body.prompt.trim();
    if (!prompt || prompt.length > 4000) {
      return NextResponse.json({ error: "Popis musí mít 1 až 4 000 znaků." }, { status: 400 });
    }
    const selfPromotionRequest = /s[aá]m na sebe|o sob[eě]|svou reklamu|reklam.{0,30}(?:msdai|asistent|sebe)|propaguj.{0,30}(?:msdai|asistent)/i.test(prompt);
    const imagePrompt = selfPromotionRequest
      ? `${prompt}\n\nMANDATORY BRAND REQUIREMENTS: This is an advertisement for the independent product MARTIVEXA. The only assistant/product brand name shown in the image must be exactly “MARTIVEXA”. Do NOT show the name ChatGPT, the OpenAI logo, or any other AI company/product branding. Create a polished Czech-language promotional ad for MARTIVEXA. If text is included, make “MARTIVEXA” the prominent headline and use a short generic tagline such as “Tvůj AI asistent”. Do not imitate another company’s logo or visual identity.`
      : prompt;
    const client = new OpenAI({ apiKey });
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt,
      size: "1024x1024",
    });
    const image = result.data?.[0];
    if (!image?.b64_json) {
      return NextResponse.json({ error: "Model nevrátil obrazová data." }, { status: 502 });
    }
    return NextResponse.json({ image: `data:image/png;base64,${image.b64_json}` });
  } catch (error) {
    console.error("MARTIVEXA image error:", error);
    return NextResponse.json({ error: "Obrázek se nepodařilo vytvořit. Ověř dostupnost modelu a oprávnění API účtu." }, { status: 500 });
  }
}
