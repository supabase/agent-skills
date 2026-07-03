# Auth

Auth (GoTrue) issues split into: **session/token not reaching the server**, **OAuth/redirect config**, **one-time-token flows** (OTP, magic link, PKCE), **MFA**, **email delivery**, and **`500`/`503` where Auth depends on the database**. Check the `auth_logs` source first; a `500` almost always means a *database* dependency failed, so check `postgres_logs` next.

`getClaims()` validates a JWT locally (signature and expiry only). `getUser()` verifies with the Auth server and confirms the session wasn't revoked. When "the session looks valid but access is wrong," this distinction is usually why — use `getUser()` for authorization decisions.

## Sessions & SSR

### `getUser()` returns null / session not visible on the server
**Cause:** The `cookie` header isn't reaching the request, so no session is transmitted.
**Fix:** Forward cookies on server-side fetches:
```ts
const res = await fetch(url, { headers: { cookie: headers().get('cookie') as string } })
```
For Next.js SSR generally: use `@supabase/ssr` (the old `@supabase/auth-helpers` is deprecated), implement the middleware that calls `getClaims()`/`getUser()` to refresh the session, and build server clients from `createServerClient`. Compare against `npx create-next-app -e with-supabase` to catch setup drift.

### `401 / 403 "invalid claim: missing sub"`
**Cause:** An API key (publishable/secret) was passed where a **user access token** was expected — API keys carry no `sub` claim.
**Fix:** Pass the user's JWT, not the key. Server-side, forward it per request:
```ts
const jwt = request.headers.get('Authorization')?.replace('Bearer ', '')
const { data: { user } } = await supabase.auth.getUser(jwt)
```

### `JWT expired` in the dashboard or client
**Cause:** Local system clock is out of sync (JWT `exp` is time-based). TOTP and OTP fail for the same reason.
**Fix:** Sync the machine's clock.

## OAuth

### OAuth doesn't redirect to the provider (server-side)
**Cause:** `signInWithOAuth` returns a URL; it doesn't redirect for you server-side.
**Fix:** Redirect to `data.url` with your framework:
```ts
const { data } = await supabase.auth.signInWithOAuth({ provider: 'github' })
return NextResponse.redirect(data.url)          // Next.js  (SvelteKit: throw redirect(303, data.url))
```

### Lands on the wrong URL (e.g. localhost in production)
**Cause:** The `redirectTo` value isn't in the allow-list.
**Fix:** Add the exact URL under **Auth → URL Configuration → Redirect URLs** (wildcards like `https://example.com/*` are allowed).

### Google sign-in fails for some (Workspace) users
**Symptom:** `500 Error getting user email from external provider` or `401 Missing required authentication credential`.
**Fix:** Request the email scope explicitly:
```js
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { scopes: 'https://www.googleapis.com/auth/userinfo.email' },
})
```

## One-time tokens (OTP, magic link, PKCE)

### `token has expired` / `otp_expired` immediately, before the user clicks
**Cause:** Email security scanners and prefetchers (Outlook Safe Links, antivirus) hit the confirmation URL first and consume the one-time token.
**Diagnose:** In `edge_logs`, look for rapid `403` on `/verify` right after send.
**Fix:** Don't auto-consume on link open. Prefer an OTP **code** the user types, or route through a website page with an explicit "confirm" button before redirecting into the app.

### `#ZgotmplZ` in the magic-link email / "cannot parse response" (PKCE)
**Cause:** Go's templating sanitizes a non-standard URL scheme (e.g. `myapp://`) placed directly in the template, and email in-app browsers break the PKCE handshake.
**Fix:** Use the **Email → Website → App** flow: set `SITE_URL` to your web domain, add the app deep link (`myapp://*`) to Additional Redirect URLs, keep `{{ .ConfirmationURL }}` (safe `https://`) in the template, and bounce to the deep link from a user-clicked button on the web callback page.

## MFA

### `Invalid TOTP code entered` with a correct code
**Cause:** Device clock drift (TOTP is time-based).
**Fix:** Sync the device clock.

### Lost MFA device, no backup factor
**Fix:** Non-SSO users can't self-recover — the app should enforce registering a backup factor. SSO users: contact support.

## Email delivery

### Auth emails (confirm, reset, magic link) not arriving
**Cause (most common):** The project is still on the built-in email provider, whose rate limit is very low and demo-only; or custom SMTP is misconfigured; or the recipient or provider suppressed the emails.
**Diagnose:** Check `auth_logs` for the handoff to the provider; check the SMTP provider's own delivery/suppression logs; check spam.
**Fix:** Configure a real custom SMTP provider (Resend, SendGrid, AWS SES, etc.). For Google Workspace SMTP: enable 2FA and use an **app password**, the sender must be the admin address, `smtp-relay.gmail.com` uses port 465 only (`smtp.gmail.com` accepts 465/587).

### Custom email template not applying (fallback template sent)
**Cause:** Invalid Go template syntax.
**Diagnose:** `auth_logs` shows `templatemailer_template_body_parse_error`.
**Fix:** Correct the syntax — e.g. `{{ .Data.display_name }}`, not `{{ .Data.display_name | default: "x" }}`.

## `500`/`503`: Auth depends on the database

### `500` on signup/login/update ("Database error saving/creating/updating new user")
**Cause:** A trigger on `auth.users` (e.g. a `handle_new_user` that writes to `public.profiles`) fails, a foreign key to `auth.users` is violated, or the trigger function lacks privileges.
**Diagnose:** `auth_logs` names the operation; `postgres_logs` shows the real SQLSTATE (constraint `23503`, permission `42501`, missing relation `42P01`).
**Fix:** The trigger function must be `security definer` and owned by a privileged role, and should pin its search path:
```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;
```
For a too-strict FK, recreate it with `on delete cascade`/`set null`. Never hand-modify `auth` schema tables beyond what's needed.

### `500` "converting NULL to string is unsupported" (e.g. `confirmation_token`)
**Cause:** Inserting a user row with raw SQL left a text column `NULL` where Auth expects `''`.
**Fix:** `update auth.users set confirmation_token = '' where confirmation_token is null;` (use the column named in the error).

### `503 AuthRetryableFetchError` — whole Auth service down
**Cause:** GoTrue failed to start, most often an invalid **Sessions → Timebox** duration.
**Fix:** Set **Auth → Sessions** Timebox to a valid value (default `4320` hours) to trigger a config reload.

### "invalid response was received from the upstream server"
**Cause:** An Auth DB migration failed to apply, often after a bad restore of `auth.schema_migrations`.
**Diagnose:** `auth_logs` shows `running db migrations: error executing migrations/<version>...`.
**Fix:** If it's the known `operator does not exist: uuid = text` migration, mark it applied: `insert into auth.schema_migrations values ('<version-from-log>');`. For other migration errors, contact support rather than guessing.
