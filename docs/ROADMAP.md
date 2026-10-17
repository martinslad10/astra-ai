# Astra AI roadmap and status

## Current foundation
- [x] Responsive chat workspace
- [x] Server-side text chat endpoint
- [x] OpenAI web search tool in chat
- [x] OpenAI Code Interpreter sandbox in chat for Python/data tasks
- [x] Browser-local recent conversation history
- [x] Server-side image generation endpoint
- [x] Environment-based API key handling
- [x] Build and lint verification in GitHub Actions
- [x] User-managed local memory notes (browser only)
- [x] Text-file attachment for common text formats
- [x] AI marketing draft workflow (posts, short-video ideas, calendar, A/B tests)
- [ ] Deploy and configure environment variables

## Next: reliable workspace
- [ ] Automated unit/integration/end-to-end tests
- [ ] Account authentication
- [ ] Persistent server-side conversations
- [ ] Cloud-based user-controlled long-term memory with inspect/edit/delete controls
- [ ] PDF/Word extraction and larger document uploads
- [ ] Streaming responses, cancellation, and retry handling
- [ ] Model/provider selection and usage limits

## Specialist capabilities
- [ ] Coding agent that can safely edit project files, show diffs, and run approved tests in an isolated environment
- [x] Optional Replicate video-generation endpoint and polling UI (requires provider credentials/model configuration)
- [ ] Marketing integrations for publishing and campaign analytics
- [ ] User confirmation before sending, publishing, or other consequential external actions

## Production hardening
- [x] Basic in-process rate limiting and request-size guards
- [ ] Shared production-grade rate limiting and abuse prevention
- [ ] Authentication and per-user data isolation
- [ ] Logging and monitoring without leaking sensitive content
- [ ] Accessibility and mobile QA
- [ ] Dependency audit and pinned lockfile

## Principles
- Be honest about capability boundaries.
- Keep credentials server-side.
- Require user confirmation for consequential external actions.
- Measure quality with tests rather than making unsupported claims of superiority.
