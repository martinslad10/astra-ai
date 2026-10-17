# Astra AI

A standalone AI workspace for reasoning, coding, and creative workflows. This repository is independent of PODNIKAI.

## Implemented in the current foundation
- Responsive Czech-language chat workspace
- Server-side text chat through the OpenAI Responses API
- Browser-local persistence for the recent chat transcript
- User-managed local memory notes with add/delete controls
- Text-file attachment for TXT, MD, CSV, JSON, HTML, XML and LOG files (15 kB limit)
- Server-side image generation endpoint using the OpenAI Images API
- API credentials are read from server environment variables and are not exposed to the browser
- Roadmap and architecture notes

## Not yet implemented
Cloud-synced account-based memory, PDF/Word extraction, sandboxed code execution, video generation, multi-provider routing, authentication, rate limiting, and production deployment still require additional implementation and testing.

## Requirements
- Node.js 20.9+
- OpenAI API key with access to the selected models

## Run locally
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `OPENAI_API_KEY` in `.env.local`
4. Optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`)
5. Run: `npm run dev`
6. Open http://localhost:3000

The image endpoint uses `gpt-image-1`; model access and billing depend on your OpenAI account. Never commit `.env.local` or share API keys.

## Deployment
Deploy the Next.js project to a compatible host and configure `OPENAI_API_KEY` as a server-side environment variable. The project has not yet been deployed or verified in a production environment.

See `docs/ROADMAP.md` for next steps.
