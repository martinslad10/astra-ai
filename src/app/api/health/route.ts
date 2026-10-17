import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Astra AI",
    capabilities: {
      chatConfigured: Boolean(process.env.OPENAI_API_KEY),
      imageGenerationConfigured: Boolean(process.env.OPENAI_API_KEY),
      localMemoryNotes: true,
      persistentCloudMemory: false,
      textFileAttachments: true,\n      marketingDrafts: Boolean(process.env.OPENAI_API_KEY),
      videoGeneration: false,
    },
  });
}
