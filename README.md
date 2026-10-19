# Astra AI

Astra AI is an independent Czech-language AI workspace for reasoning, coding assistance, and creative workflows. It is a separate project from PODNIKAI.

## Available features in the current codebase

- Responsive Czech-language chat workspace
- Server-side text chat through the OpenAI Responses API
- Optional OpenAI web search and hosted Code Interpreter tools; access depends on API-key permissions, model support, and account billing
- Browser-local recent chat transcript
- User-managed local memory notes with add/delete controls
- Optional Supabase email-link sign-in and opt-in cloud synchronization for memory notes, after configuring Supabase and applying the SQL migration
- Text attachments: TXT, MD, CSV, JSON, HTML, XML, LOG (15 kB limit)
- PDF and DOCX text extraction (5 MB limit); scanned PDFs need OCR, which is not included
- Server-side image-generation endpoint using the OpenAI Images API
- Optional video-generation integration via Replicate with status polling; the configured model must accept the submitted input schema
- AI marketing drafts: social posts, short-video concepts, a 7-day content plan, and A/B test ideas
- Server-side environment-variable handling for provider credentials
- Request-size validation and lightweight per-process rate limits

## Important limitations before a public launch

- The coding page generates code suggestions. It does not yet edit arbitrary project files or execute user/generated code in an isolated workspace.
- Chat history is stored in the browser and is not synchronized to the cloud.
- Cloud memory is an opt-in first version, not a robust multi-device conflict-resolution system. It requires a configured Supabase project, migration, auth redirect settings, and production testing.
- Memory notes are not automatically loaded from Supabase into chat. The chat currently receives browser-local notes as optional context.
- Video generation requires a compatible Replicate model, token, and provider credit.
- Marketing outputs are drafts only. Astra AI does not publish to social networks or read campaign analytics.
- Rate limiting is in-process and is not sufficient by itself for high-traffic or abuse-prone public production use.
- Health endpoint configuration flags show whether environment variables exist; they do not verify provider credentials, permissions, billing, or successful live requests.
- Automated end-to-end coverage, cross-account RLS testing, accessibility/mobile QA, and live provider smoke tests remain necessary.

## Requirements

- Node.js 20.9+
- An OpenAI API key with access to the selected model and any desired tools
- Optional: a Supabase project for account sign-in and cloud memory
- Optional: a Replicate token and compatible video model

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `OPENAI_API_KEY` in `.env.local`
4. Optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`)
5. Run `npm run lint` and `npm run build`
6. Start with `npm run dev` and open http://localhost:3000

Chat web search and Code Interpreter require provider/model/tool access and may incur charges. Image generation uses `gpt-image-1`; access and billing depend on the OpenAI account. Optional video generation requires `REPLICATE_API_TOKEN` and `REPLICATE_VIDEO_MODEL` in `owner/model` format.

## Supabase account and cloud memory

Follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or a `NEXT_PUBLIC_*` variable. Test row-level security with separate test accounts before storing sensitive data.

## Deployment and public release

The repository has CI for lint and build, and a Vercel URL has been used during development. A passing build is not proof that production provider credentials, Supabase sign-in, image generation, or video generation work. Before announcing full functionality, run the launch checklist in [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) and test the live site with the actual configured services.

Never commit `.env.local`, real API keys, user data, or provider secrets.
