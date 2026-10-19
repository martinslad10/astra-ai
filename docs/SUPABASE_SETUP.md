# Supabase setup for Astra AI accounts and memory sync

Astra AI keeps chat history locally in the browser. The account page supports passwordless email sign-in through Supabase, and the memory page has an explicit, opt-in cloud-sync action. Cloud sync is not available until the Supabase project, schema and deployment environment are configured.

## Configure Supabase

1. Create a Supabase project.
2. In the Supabase SQL Editor, apply `supabase/migrations/202610180001_initial_schema.sql`.
3. In Supabase Authentication settings, configure the site URL and allowed redirect URLs. Add the production URL and local development URL you use, including the `/account` callback path if required by your project settings.
4. In the Vercel project settings, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the relevant deployment environments.
5. Redeploy after changing environment variables.
6. Open `/account`, request a sign-in link using an email you control, and confirm that the link returns to Astra AI.
7. Open `/memory` and click **Synchronizovat s cloudem** to merge local notes with notes stored for that signed-in account.

The browser uses the public/anon key only. Row-level security policies in the migration scope memory notes to `auth.uid()`. Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable or browser code.

## Current behavior and limitations

- Memory remains local unless the user explicitly starts cloud sync.
- Sync merges local and remote notes by ID, uploads the merged set and then reloads the rows allowed by RLS. It is a first version, not a conflict-resolution system for simultaneous edits across multiple devices.
- Deleting a note attempts to delete the matching cloud row when a signed-in Supabase client is available. If offline or misconfigured, the local note is removed but the cloud delete may fail; the UI shows a notice.
- Chat history is still local and is not yet synced to the cloud.
- Browser-local memory notes are sent as optional context when a chat message is submitted. Notes existing only in Supabase are not automatically loaded into the chat; sync them to this browser first.
- Account deletion/export and a full account lifecycle flow are not implemented.

## Security verification before production use

The migration enables row-level security and applies ownership checks using `auth.uid()`. Before storing sensitive or important information, test with two separate accounts and verify neither account can read, update or delete the other's rows. Also test expired sessions, email-link redirects, missing environment variables and database errors. Do not expose service-role credentials to the client.
