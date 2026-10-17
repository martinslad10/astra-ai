import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Astra AI",
    capabilities: {
      chatConfigured: Boolean(process.env.OPENAI_API_KEY),
      imageGenerationConfigured: Boolean(process.env.OPENAI_API_KEY),
      persistentCloudMemory: false,
      videoGeneration: false,
    },
  });
}
