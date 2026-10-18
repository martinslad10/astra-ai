import { NextResponse } from "next/server";

export function GET() {
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const videoConfigured = Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_VIDEO_MODEL);
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return NextResponse.json({
    status: "ok",
    app: "Astra AI",
    environment: process.env.NODE_ENV || "unknown",
    capabilities: {
      chatConfigured: openAiConfigured,
      webSearchConfigured: openAiConfigured,
      sandboxedCodeInterpreterConfigured: openAiConfigured,
      imageGenerationConfigured: openAiConfigured,
      localMemoryNotes: true,
      persistentCloudMemoryConfigured: supabaseConfigured,
      textFileAttachments: true,
      pdfDocxExtraction: true,
      marketingDraftsConfigured: openAiConfigured,
      videoGenerationConfigured: videoConfigured,
    },
    notes: [
      "Configuration flags only indicate that environment variables exist; they do not verify provider credentials, permissions, billing, or live requests.",
      "Browser-local memory is available without account sync.",
      "PDFs containing only scanned images require OCR, which is not included.",
    ],
  }, { headers: { "Cache-Control": "no-store" } });
}
