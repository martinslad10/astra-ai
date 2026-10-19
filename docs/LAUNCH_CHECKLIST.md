# Astra AI public launch checklist

Use this before announcing the site publicly. Mark an item complete only after the check has actually been performed.

## Build and repository
- [ ] Latest GitHub Actions run on the exact release commit passes both lint and build.
- [ ] Production build starts successfully using `npm run build` and `npm run start`.
- [ ] `.env.local` and all provider credentials are excluded from Git.
- [ ] Public README accurately describes available and unavailable features.

## Live site
- [ ] Open the production URL in a private browser window and on a mobile viewport.
- [ ] Visit `/`, `/account`, `/memory`, `/code`, `/marketing`, `/images`, and `/video`.
- [ ] Confirm `/api/health` reports configuration flags without exposing secrets.
- [ ] Send a basic chat prompt and confirm a response is returned.
- [ ] Test web search and Code Interpreter separately if those capabilities are being advertised.
- [ ] Test image generation with the production key and confirm image permission and billing are enabled.
- [ ] Test video generation only after configuring a compatible Replicate model and verifying provider credit.
- [ ] Test file extraction with a small text file, a normal PDF, and a DOCX; disclose that scanned PDF OCR is unavailable.
- [ ] Test malformed JSON, oversized request rejection, and rate-limit responses on API routes.
- [ ] Review runtime logs for errors without logging secrets or full sensitive user content.

## Supabase (only if account/cloud memory is enabled)
- [ ] Apply the SQL migration to the intended Supabase project.
- [ ] Configure production site URL and allowed auth redirect URLs.
- [ ] Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the production environment.
- [ ] Test email-link sign-in and sign-out using an account you control.
- [ ] Test cloud memory sync and deletion.
- [ ] Use two separate test accounts to verify that neither can read, update, or delete the other's notes.
- [ ] Do not expose or use a service-role key in the browser.
- [ ] If any check fails, disable the affected cloud feature until fixed.

## Product boundaries to disclose
- Coding assistant currently suggests code but does not edit arbitrary project files or run user code in a sandbox.
- Chat history is browser-local, not cloud-synced.
- Cloud memory is opt-in and its first version does not provide robust conflict resolution.
- Marketing generates drafts; it does not publish posts or access campaign analytics.
- Video and image creation depend on separately configured provider accounts and may incur charges.
- Rate limiting is per process and not a complete high-scale abuse-prevention solution.

## Release decision

Do not claim every feature is production-ready until the relevant live checks above pass. If only chat has been tested, describe this as an early-access/beta release and list the other integrations as optional or experimental.
