import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });
    }
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("prompt" in body) || typeof body.prompt !== "string") {
      return NextResponse.json({ error: "Zadej textový popis obrázku." }, { status: 400 });
    }
    const prompt = body.prompt.trim();
    if (!prompt || prompt.length > 4000) {
      return NextResponse.json({ error: "Popis musí mít 1 až 4 000 znaků." }, { status: 400 });
    }
    const client = new OpenAI({ apiKey });
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });
    const image = result.data?.[0];
    if (!image?.b64_json) {
      return NextResponse.json({ error: "Model nevrátil obrazová data." }, { status: 502 });
    }
    return NextResponse.json({ image: `data:image/png;base64,${image.b64_json}` });
  } catch (error) {
    console.error("Astra AI image error:", error);
    return NextResponse.json({ error: "Obrázek se nepodařilo vytvořit. Ověř dostupnost modelu a oprávnění API účtu." }, { status: 500 });
  }
}
