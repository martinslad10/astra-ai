# Architecture

- **Web app:** Next.js App Router + React + TypeScript.
- **Chat UI:** client component under `src/app/page.tsx`.
- **Chat API:** `POST /api/chat`, server-side OpenAI SDK using the Responses API.
- **Image API:** `POST /api/images`, server-side OpenAI Images API.
- **Local history:** recent chat messages are stored in the current browser's local storage. This is not cloud sync or cross-device memory.
- **Secrets:** environment variables only; never expose API keys to the browser.
- **Future providers:** isolate model, image, and video providers behind server-side adapters.
- **Future memory:** explicit user-controlled records, with inspect/edit/delete and retention policy.
- **Future agent tools:** scoped permissions, sandboxing, audit logs, and approval gates for external side effects.

This is an actively developed foundation, not yet a full multi-agent or multimodal platform.
