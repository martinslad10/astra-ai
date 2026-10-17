# Architecture

- **Web app:** Next.js App Router + React + TypeScript.
- **Chat UI:** client component under `src/app/page.tsx`.
- **Chat API:** `POST /api/chat`, server-side OpenAI SDK.
- **Secrets:** environment variables only; never expose API keys to the browser.
- **Future providers:** isolate model, image, and video providers behind server-side adapters.
- **Future memory:** explicit user-controlled records, with inspect/edit/delete and retention policy.
- **Future agent tools:** scoped permissions, sandboxing, audit logs, and approval gates for external side effects.

This repository is a first foundation, not yet a full multi-agent or multimodal platform.
