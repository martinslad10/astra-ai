import { createClient } from "@supabase/supabase-js";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Chybí přihlášení." }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: "Chybí konfigurace databáze." }, { status: 503 });
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Přihlášení vypršelo." }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const artifactId = searchParams.get("artifactId") || "";
    if (!artifactId) return NextResponse.json({ error: "Chybí identifikátor výstupu." }, { status: 400 });
    const { data: artifact, error } = await supabase.from("business_artifacts")
      .select("id,workspace_id,title,content,artifact_type,created_at")
      .eq("id", artifactId).eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    if (!artifact) return NextResponse.json({ error: "Výstup nebyl nalezen." }, { status: 404 });
    const lines = String(artifact.content || "").split(/\r?\n/);
    const children = [
      new Paragraph({ text: artifact.title, heading: HeadingLevel.TITLE, spacing: { after: 280 } }),
      new Paragraph({ text: "ChatSLADAI · Podnikání", style: "Subtitle", spacing: { after: 320 } }),
      ...lines.map((line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return new Paragraph({ children: [new TextRun("")], spacing: { after: 100 } });
        if (trimmed.startsWith("### ")) return new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 });
        if (trimmed.startsWith("## ")) return new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 });
        if (trimmed.startsWith("# ")) return new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1 });
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return new Paragraph({ text: trimmed.slice(2), bullet: { indent: 360 } });
        if (/^\d+\. /.test(trimmed)) return new Paragraph({ text: trimmed.replace(/^\d+\. /, ""), numbering: { reference: "business-numbering", level: 0 } });
        return new Paragraph({ children: [new TextRun(trimmed)] });
      }),
    ];
    const document = new Document({
      numbering: { config: [{ reference: "business-numbering", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start", style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
      sections: [{ properties: {}, children }],
    });
    const buffer = await Packer.toBuffer(document);
    const safeName = String(artifact.title).normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "ChatSLADAI-vystup";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="' + safeName + '.docx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Business DOCX export error:", error);
    return NextResponse.json({ error: "Dokument se nepodařilo vytvořit." }, { status: 500 });
  }
}
