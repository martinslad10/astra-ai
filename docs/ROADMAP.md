# Astra AI roadmap and verified status

This checklist describes the codebase, not a guarantee that external providers are configured or that a feature has passed live production tests.

## Current foundation
- [x] Responsive Czech-language chat workspace
- [x] Server-side text chat endpoint using OpenAI Responses API
- [x] Optional OpenAI web search and Code Interpreter tools with fallback to basic chat
- [x] Browser-local recent conversation history
- [x] User-managed local memory notes
- [x] PDF/DOCX text extraction (5 MB limit; scanned PDFs need OCR)
- [x] Server-side image generation endpoint (provider access must be tested)
- [x] AI marketing drafts (no automatic publishing or analytics integration)
- [ ] Video generation (intentionally postponed until a later release)
- [x] Supabase browser client and email-link sign-in UI
- [x] Explicit, opt-in first-version cloud sync for memory notes
- [x] Environment-based secret handling, request-size guards, baseline security headers
- [x] GitHub Actions lint and build workflow

## Still required for a complete product
- [ ] Safe coding workspace that can edit user-selected project files, present reviewable diffs, and run approved tests in a genuinely isolated sandbox
- [ ] Cloud conversation history and explicit cloud memory loading into AI context
- [ ] Robust multi-device memory conflict resolution and reliable deletion/export flows
- [ ] Automated unit, API integration, and end-to-end tests
- [ ] Streaming responses, cancellation, retry handling, and better usage/cost feedback
- [ ] Shared production-grade rate limiting, abuse protection, and request monitoring
- [ ] Marketing integrations for social publishing and campaign analytics, with explicit user confirmation
- [ ] OCR for scanned PDFs
- [ ] Multi-provider routing and model selection
- [ ] Mobile/accessibility QA, production smoke tests, and deployment monitoring
- [ ] Dependency audit and committed, reproducible lockfile

## Public launch gate

A successful CI build verifies lint/build only. Before calling a feature production-ready, test it against the live deployment with the actual provider credentials and account permissions. Before enabling cloud data for general users, verify Supabase redirect settings and RLS isolation using at least two separate accounts. Do not advertise unavailable integrations as working.

## Principles
- Be honest about capability boundaries.
- Keep credentials server-side.
- Require user confirmation for consequential external actions.
- Never run untrusted generated code on the app server.
- Measure quality with tests rather than making unsupported claims.


## Implemented in the research lab

- Coordinator → specialist → independent reviewer workflow.
- Research, invention, engineering, and business modes.
- Optional web search and Code Interpreter, with a no-tools fallback.
- Downloadable Markdown reports and visible workflow status.

## Still required for a reliable advanced workspace

- Automated unit/integration/E2E tests and live smoke tests for every provider integration.
- A true isolated code workspace with explicit user approval before writing project files or executing generated code.
- Persistent project workspaces and versioned artifacts.
- Patent/literature database integrations and source-level citation validation.
- Shared rate-limit credential repair and production abuse controls.
- Real-world prototype testing remains a human/lab responsibility.
