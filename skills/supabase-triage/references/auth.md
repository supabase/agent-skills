# Auth Triage

Curated from Supabase's GitHub Troubleshooting discussions. Each entry: **Symptom → Cause → Fix**. If nothing here matches, check `index.md` or run a live search (see SKILL.md).

## Database error saving new user
**Symptom:** 500 "Database error saving new user" when inviting/creating a user from the dashboard, or on failed signups.
**Cause:** A trigger on `auth.users` errors out (e.g. inserting into a `public.profiles` table that doesn't exist), a constraint on `auth.users` isn't met, or Prisma has clobbered `auth.users` permissions. A common variant — `Scan error on column ... converting NULL to string is unsupported` — happens when a user row is inserted directly via SQL (or an AI tool doing a raw `INSERT`) instead of through the Auth API, leaving required text columns `NULL` when GoTrue expects `''`.
**Fix:** Check Auth logs first, then Postgres logs, for the specific trigger/constraint error. For the NULL-column variant: `update auth.users set <column> = '' where <column> is null;`. For missing-table triggers: create the missing table or fix/remove the trigger function.
Source: https://github.com/orgs/supabase/discussions/13043

## Not receiving Auth emails
**Symptom:** Signup/magic-link/reset emails never arrive.
**Cause:** The built-in email provider is rate-limited and demo-only. Beyond that, delivery failures split into: (1) handover issues — misconfigured custom SMTP, visible in Auth logs; (2) provider-side issues — email provider suppression lists from past bounces; (3) recipient-side issues — the user's mail server denylisting Supabase's sending domain/IP or filtering on "password reset"/"verification" keywords.
**Fix:** Configure custom SMTP for anything beyond testing. Check Auth logs for handover errors first, then the SMTP provider's own delivery logs, then ask the affected user to check spam/mail-admin blocks.
Source: https://github.com/orgs/supabase/discussions/22610

## Resolving 500 status Auth errors
**Symptom:** Auth requests return 500.
**Cause:** Almost always an external dependency failing, not Auth itself — most often the database. Query the Postgres logs filtered to `supabase_auth_admin` with `error_severity` ERROR/FATAL/PANIC to find the underlying error.
**Fix:** SQL to run in the Log Explorer (**BigQuery/Logflare dialect — not valid Postgres, do not run via `execute_sql`**):
```sql
select cast(postgres_logs.timestamp as datetime) as timestamp, event_message, parsed.error_severity, parsed.user_name, parsed.query, parsed.sql_state_code
from postgres_logs
cross join unnest(metadata) as metadata cross join unnest(metadata.parsed) as parsed
where regexp_contains(parsed.error_severity, 'ERROR|FATAL|PANIC') and regexp_contains(parsed.user_name, 'supabase_auth_admin')
order by timestamp desc limit 100;
```
A `23503`/`23*` SQL state usually means a manually-added foreign key to the `auth` schema is blocking GoTrue's own writes to `auth.users`.
Source: https://github.com/orgs/supabase/discussions/28652

## Rotating Anon, Service, and JWT secrets
**Symptom:** Need to rotate leaked/compromised keys.
**Cause:** N/A — routine security hygiene, but the legacy anon/service/JWT secrets can no longer be rotated once migrated to asymmetric signing keys.
**Fix:** Project Settings → JWT Keys → JWT Signing Keys tab → Rotate Keys (moves current key to "Previously used keys") → Revoke the old key once rollout is confirmed. Not revoking means old keys stay valid indefinitely.
Source: https://github.com/orgs/supabase/discussions/20031

## OAuth sign-in isn't redirecting server-side
**Symptom:** `signInWithOAuth()` doesn't redirect when called from a server action/route handler.
**Cause:** The auth-helpers library has no built-in server-side redirect mechanism (frameworks differ) — it returns the redirect URL via `data.url` instead, which the caller must redirect to explicitly.
**Fix:** `const { data } = await supabase.auth.signInWithOAuth({...}); return NextResponse.redirect(data.url)` (Next.js) / `throw redirect(303, data.url)` (SvelteKit) / `return redirect(data.url)` (Remix).
Source: https://github.com/orgs/supabase/discussions/15862

## PKCE flow errors: 'cannot parse response' or '#ZgotmplZ'
**Symptom:** Magic-link email templates render `#ZgotmplZ`, or mobile deep-link login throws "cannot parse response".
**Cause:** Go's html/template auto-sanitizes `{{ .SiteURL }}` in email templates: if the URL doesn't start with a scheme Go recognizes as safe (`http://`/`https://`), Go replaces it with `#ZgotmplZ` — this bites custom mobile deep-link schemes (`myapp://`) used with PKCE.
**Fix:** See the full article for the template workaround (route through an intermediate `https://` confirmation URL rather than putting the custom scheme directly in `{{ .SiteURL }}`).
Source: https://github.com/orgs/supabase/discussions/42481

## Auth error: 503 AuthRetryableFetchError
**Symptom:** All auth requests fail with 503 AuthRetryableFetchError; GoTrue looks like it won't start.
**Cause:** GoTrue fails to initialize because a config value is invalid — almost always an out-of-range or malformed `GOTRUE_SESSIONS_TIMEBOX` duration.
**Fix:** Dashboard → Auth → Sessions settings → Timebox duration → set to a valid smaller value or the default (4320 hours) → save triggers a config reload and GoTrue restarts.
Source: https://github.com/orgs/supabase/discussions/45687

## Auth error: 401 invalid claim: missing sub
**Symptom:** `supabase.auth.getUser()` throws 401 "invalid claim: missing sub".
**Cause:** An API key (publishable/secret/anon/service) was passed where a user access token (JWT with a `sub` claim) was expected — API keys don't carry a `sub`. Also happens if `getUser()` is called before sign-in completes, or a per-request server client wasn't given the user's session JWT.
**Fix:** Ensure the token passed is the Auth access token, not an API key. For per-request server clients, forward the user's JWT explicitly (e.g. `Authorization: Bearer <user_jwt>` header) and call `getUser(user_jwt)`.
Source: https://github.com/orgs/supabase/discussions/21347

## OTP verification failures: 'token has expired' / 'otp_expired'
**Symptom:** `verifyOtp()` or the magic-link `/verify` endpoint returns 403 with `otp_expired`, or "Email link is invalid or has expired".
**Cause:** The OTP/magic-link token's validity window has passed, or it was already used.
**Fix:** Have the user request a fresh OTP/link; check the configured OTP expiry duration if this happens unexpectedly fast.
Source: https://github.com/orgs/supabase/discussions/41943

## Google Auth fails for some users
**Symptom:** `error=server_error&error_description=Error+getting+user+email+from+external+provider`, or "Missing required authentication credential" from Google.
**Cause:** Some Google Workspace configurations require the email scope to be explicitly requested — it isn't always granted implicitly.
**Fix:** `supabase.auth.signInWithOAuth({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/userinfo.email' } })`.
Source: https://github.com/orgs/supabase/discussions/14883
