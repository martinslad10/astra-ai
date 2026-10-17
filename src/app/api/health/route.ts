import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Astra AI",
    capabilities: {
      chatConfigured: Boolean(process.env.OPENAI_API_KEY),
      webSearch: Boolean(process.env.OPENAI_API_KEY),
      sandboxedCodeInterpreter: Boolean(process.env.OPENAI_API_KEY),
      imageGenerationConfigured: Boolean(process.env.OPENAI_API_KEY),
      localMemoryNotes: true,
      persistentCloudMemory: false,
      textFileAttachments: true,
      marketingDrafts: Boolean(process.env.OPENAI_API_KEY),
      videoGeneration: Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_VIDEO_MODEL),
    },
  });
}
