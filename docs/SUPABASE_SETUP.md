# Supabase setup (optional cloud foundation)

Astra AI currently stores chat history and memory notes in the browser. This migration prepares isolated cloud tables for user profiles, conversations, messages and memory notes; it does **not** turn cloud sync on by itself.

## Setup later, together
1. Create a Supabase project.
2. In SQL Editor, apply `supabase/migrations/202610180001_initial_schema.sql`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the deployment environment.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it in a client component.
5. Implement and test sign-in, session validation, account deletion/export and per-request ownership checks before enabling cloud data.
6. Test RLS using two separate test accounts and verify that neither can read, change or delete the other's rows.

## Security boundary
The schema enables row-level security and scopes records by `auth.uid()`. It is only a database foundation. Do not store sensitive information in cloud tables until API authentication and account lifecycle flows are implemented and verified. Existing local memory continues to work independently.
