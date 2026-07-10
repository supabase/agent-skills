# Example Diagnoses

Ten worked examples of this skill's symptom → cause → fix reasoning, distilled from real community support threads. Usernames and verbatim quotes are omitted; only the symptom and the confirmed resolution are kept.

## 1. OAuth provider "is not enabled" despite being toggled on

**Symptom:** Enabling the X/Twitter OAuth 2.0 provider in the dashboard succeeds, but the authorize endpoint returns "Unsupported provider: provider is not enabled" for `provider=twitter`, and "could not be found" for `provider=twitter_v2`.
**Confirmed cause:** Wrong provider slug — the OAuth 2.0 provider is `x`, not `twitter` (the deprecated OAuth 1.0a provider) or `twitter_v2` (doesn't exist).
**Fix:** Use `provider: "x"` in `signInWithOAuth()` / the authorize URL.

## 2. Auth users migrated between projects, login continuity unclear

**Symptom:** Migrating from one Supabase-compatible backend to an owned project; unsure whether restoring `auth.users` alone is sufficient for email/password login continuity.
**Confirmed cause/guidance:** Restoring `auth.users` plus `auth.identities` is sufficient to preserve user IDs and password hashes; users must still log in again since JWT/session continuity isn't preserved across the migration.

## 3. Webhook stops firing on UPDATE for newly inserted rows

**Symptom:** A working webhook (fires on insert + update) stops firing on UPDATE specifically for rows inserted after a Supabase CLI version upgrade, while old rows and inserts still work.
**Confirmed cause:** Reported alongside a payload/body-size-limit issue in the underlying `pg_net` extension; the practical workaround is a trigger that sends only the critical columns rather than the full old/new row payload.

## 4. Auth refresh returns 500 after new session columns appear

**Symptom:** Production Auth token refresh returns HTTP 500 with `missing destination name oauth_client_id in *models.Session`, blocking all live users; `auth.sessions` already has newer columns (`oauth_client_id`, `refresh_token_hmac_key`, etc.).
**Confirmed cause/guidance:** A hosted Auth service/schema version mismatch — this requires filing a support ticket for the project to be checked directly; a project restart and/or Postgres version upgrade are the practical next steps to try first.

## 5. Edge Function deploy fails with "request entity too large"

**Symptom:** `supabase functions deploy` fails with `413: request entity too large` on a function whose bundled script size is reported near/over 20MB.
**Confirmed cause:** Edge Functions have a 20MB bundle size limit.
**Fix:** Reduce bundle size (e.g. avoid bundling large PDF-generation libraries; lazy-load heavy dependencies in the browser instead) or split the function.

## 6. Project stays restricted after a billing cycle resets

**Symptom:** A Free Plan project was restricted for exceeding the Cached Egress quota (402 errors); the billing cycle has since reset and usage is back under the limit, but the restriction hasn't lifted.
**Confirmed cause/guidance:** Restriction lifts automatically within roughly 24-48 hours of the cycle reset; if it's a dashboard warning rather than an active restriction, it's just a reminder of the prior overage, not a current block.

## 7. Realtime broadcast usage far exceeds expectations

**Symptom:** Broadcasting frequent row-level status changes to ~30 concurrent clients at a 2Hz polling rate produces a much higher message volume (and cost) than expected.
**Confirmed cause/guidance:** Realtime message counts scale with (changes × subscribers), so worst-case volume is usually much lower than a naive "everyone changes every tick" estimate; consider batching/combining changes into a single broadcast call, or polling instead of full broadcast fan-out, to control volume.

## 8. Webhooks fail to enable after a project restore

**Symptom:** After restoring/migrating a project via `pg_dump`/`pg_restore`, enabling webhooks fails with "Superuser owned event trigger must execute a superuser owned function" — an internal Supabase function's ownership no longer matches what the restore expects.
**Confirmed cause/guidance:** Internal ownership on Supabase-managed functions (e.g. `extensions.grant_pg_net_access`) can be altered by a restore; the official backup/restore guide's disclaimer about commenting out `ALTER ... OWNER TO "supabase_admin"` lines in the dumped schema is the relevant starting point, though the exact fix can require reversing that ownership change depending on which direction it drifted.

## 9. Region migration planning

**Symptom:** A project was created in the wrong region relative to where the application and users actually are, and the team wants to move it with minimal downtime.
**Confirmed cause/guidance:** Supabase does not support changing a project's region in place — creating a new project in the target region and migrating schema, Auth users, Storage, and RLS policies into it is the only supported path; there's no logical-replication shortcut available today.

## 10. RLS Storage upload failures despite a policy that looks correct

**Symptom:** Client-side Storage uploads return 403 even though an RLS policy appears to allow `insert` for authenticated users.
**Confirmed cause:** An asymmetric or missing policy pairing — commonly an `insert` policy without a matching `select`, or a policy targeting the wrong `bucket_id`/`storage.objects` predicate — causes the operation to be silently denied. See [rls.md](rls.md) and [realtime-storage.md](realtime-storage.md) for the specific policy shapes Storage requires.
