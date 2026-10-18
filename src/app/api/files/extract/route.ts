import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 100_000;

export async function POST(request: Request) {
  const limit = rateLimit(request, "file-extract", 8);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Příliš mnoho požadavků. Zkus to znovu za chvíli." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Chybí soubor." }, { status: 400 });
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isDocx = name.endsWith(".docx");
    if (!isPdf && !isDocx) return NextResponse.json({ error: "Podporujeme pouze PDF a DOCX." }, { status: 415 });
    if (file.size === 0) return NextResponse.json({ error: "Soubor je prázdný." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Dokument překračuje limit 5 MB." }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let extracted = "";
    if (isPdf) {
      const result = await pdf(buffer);
      extracted = result.text;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      extracted = result.value;
    }
    const text = extracted.replace(/\u0000/g, "").trim().slice(0, MAX_TEXT_CHARS);
    if (!text) return NextResponse.json({ error: "Dokument neobsahuje čitelný text. U skenovaného PDF je potřeba OCR, které zatím není součástí aplikace." }, { status: 422 });
    return NextResponse.json({ text, truncated: extracted.length > MAX_TEXT_CHARS });
  } catch (error) {
    console.error("Astra AI document extraction error:", error);
    return NextResponse.json({ error: "Dokument se nepodařilo zpracovat. Zkontroluj, že soubor není poškozený nebo chráněný heslem." }, { status: 422 });
  }
}
