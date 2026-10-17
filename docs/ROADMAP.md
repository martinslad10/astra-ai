# Astra AI roadmap and status

## Current foundation
- [x] Responsive chat workspace
- [x] Server-side text chat endpoint
- [x] Browser-local recent conversation history
- [x] Server-side image generation endpoint
- [x] Environment-based API key handling
- [x] Install dependencies and verify production build (GitHub Actions)
- [x] User-managed local memory notes (browser only)
- [x] Text-file attachment for common text formats
- [x] AI marketing draft workflow (posts, short-video ideas, calendar, A/B tests)
- [ ] Deploy and configure environment variables

## Next: reliable workspace
- [ ] Automated tests and continuous integration
- [ ] Account authentication
- [ ] Persistent server-side conversations
- [ ] Cloud-based user-controlled long-term memory with inspect/edit/delete controls
- [ ] File uploads and document analysis
- [ ] Streaming responses, cancellation, and retry handling
- [ ] Model/provider selection and usage limits

## Specialist capabilities
- [ ] Sandboxed coding agent with diff review and explicit execution approval
- [ ] Video generation provider integration
- [ ] Marketing workflows for content calendars, copy variants, and campaign drafts
- [ ] User confirmation before sending, publishing, or other consequential external actions

## Production hardening
- [ ] Rate limiting and abuse prevention
- [ ] Authentication and per-user data isolation
- [ ] Logging and monitoring without leaking sensitive content
- [ ] Accessibility and mobile QA
- [ ] Unit, integration, and end-to-end tests

## Principles
- Be honest about capability boundaries.
- Keep credentials server-side.
- Require user confirmation for consequential external actions.
- Measure quality with tests rather than making unsupported claims of superiority.
