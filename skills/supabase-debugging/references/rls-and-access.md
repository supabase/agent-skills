# RLS & database access

The single most common Supabase bug: a query returns an **empty array** (or the wrong rows, or `42501 permission denied`) even though the data is there. This is almost always Row-Level Security or a missing table privilege — not a bug in your query. An empty result with **no error** is the signature of RLS; a `42501` error is the signature of a missing `GRANT`.

## Diagnose in order

Run these checks top-to-bottom; each rules out one cause.

1. **Is RLS enabled?** `select relname, relrowsecurity from pg_class where relname = 'your_table';` — `relrowsecurity = true` means every access needs a matching policy.
2. **Does a valid session exist?** Create and call this once to see the role and claims the request actually runs as:
   ```sql
   create function test_authorization_header() returns json language sql as $$ select auth.jwt(); $$;
   ```
   Call it via `supabase.rpc('test_authorization_header')`. If the role is `anon` when you expected `authenticated`, the user's JWT is not reaching Postgres — fix the client/session first (see [auth.md](auth.md)).
3. **Does the role have table privileges?** `select grantee, privilege_type from information_schema.role_table_grants where table_name = 'your_table';` — RLS runs *after* the base `GRANT`; without it you get `42501`.
4. **Do matching policies exist for this action and role?** `select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'your_table';`
5. **Does the policy predicate evaluate true for this user?** Test it by impersonating the role (see below).

### Test a policy by impersonating a role

Reproduce exactly what a signed-in user sees, in the SQL editor:

```sql
set session role authenticated;
set request.jwt.claims to '{"role":"authenticated","sub":"<a-real-user-uuid>"}';
select * from your_table;          -- returns only what that user can see
reset role;                         -- always reset when done
```

If this returns the expected rows, the policy is correct and the problem is client-side (wrong/absent JWT). If it returns nothing, the policy predicate is the problem.

## Common causes and fixes

### Empty array, RLS enabled, no policy matches
**Cause:** RLS is on and no policy grants the querying role `SELECT`, or the predicate is false (often `auth.uid()` is `null` because the user is not signed in).
**Fix:** Add a policy that matches your access model. Ownership pattern:
```sql
create policy "read own rows" on your_table for select
to authenticated using ((select auth.uid()) = user_id);
```
For public read, use `to anon, authenticated using (true)`. Never leave a table in an exposed schema with RLS enabled and zero policies unless you intend it to be invisible.

### `service_role` client still hits RLS / returns empty
**Cause:** `service_role` bypasses RLS, so this means the request is **not actually using the service key** — a user JWT is overriding the `Authorization` header. Happens when an SSR client built from cookies is reused, when `Authorization: Bearer <user-token>` is set on a service client, or after `signUp()`/`signInWithPassword()` returns a session that replaces the key.
**Diagnose:** In DevTools → Network, inspect the `Authorization` header on the failing request; if it carries a user JWT, that is the bug.
**Fix:** Build a dedicated admin client that never shares user session state, and keep the secret key server-only:
```ts
import { createClient } from '@supabase/supabase-js'
const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
```
Use `admin.auth.admin.createUser()` for user creation instead of `signUp()`.

### `42501 permission denied for table ...` (HTTP 401/403)
**Cause:** The role lacks the base table privilege (this is separate from RLS), or you are touching a protected schema (`auth`, `vault`), or a custom schema that is not exposed.
**Fix:** Grant the needed privilege:
```sql
grant select, insert, update, delete on table public.your_table to anon, authenticated;
```
For protected schemas, never query them directly — wrap access in a `security definer` function that includes its own `auth.uid()` check. Confirm which statement failed with the logs query below.

### `42501 permission denied for table http_request_queue`
**Cause:** `pg_net` extension state is corrupted.
**Fix:** First confirm the queue is drained — `select * from net.http_request_queue;` should be empty, because recreating the extension discards anything still queued. Then reset it: `drop extension pg_net; create extension pg_net schema extensions;`. If dependent objects block the drop, contact support.

### UPDATE/DELETE reports 0 rows changed (no error)
**Cause:** An UPDATE/DELETE policy needs a `using` clause to *see* the row before it can change it. With only `with check`, the row is invisible and nothing is updated.
**Fix:** Provide both clauses:
```sql
create policy "update own" on your_table for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```
`with check` also prevents a user from reassigning a row's `user_id` to someone else.

### INSERT/UPDATE succeeds but the client sees "no rows returned"
**Cause:** PostgREST returns the affected rows via an implicit `SELECT`. Without a `SELECT` policy, the write commits but the return is empty — looks like a silent failure.
**Fix:** Add a matching `SELECT` policy alongside the INSERT/UPDATE policy.

### Policy or function silently wrong with camelCase names
**Cause:** Postgres folds unquoted identifiers to lowercase, so `userId` becomes `userid` and never matches the real `"userId"` column.
**Fix:** Quote camelCase identifiers (`"userId"`), or — far better — use `snake_case` for every database identifier to eliminate the whole class of bug.

### `permission denied for function ...` on an RPC
**Cause:** `EXECUTE` was revoked from the calling role.
**Fix:** `grant execute on function your_fn to authenticated;` (or `to anon` / `to public`).

### `security definer` function used in a policy doesn't run
**Cause:** The function isn't reachable from the policy's search path.
**Fix:** Schema-qualify it in the policy — `using ((select private.can_access(id)))` — and keep it in a non-exposed schema. You do **not** need to add `security definer` functions to the exposed-schemas list for them to work in policies.

### Deprecated `auth.role()` / `auth.email()`
**Cause:** `auth.role()` breaks silently once anonymous sign-ins are enabled (anonymous users carry the `authenticated` Postgres role).
**Fix:** Replace `auth.role() = 'authenticated'` with the `to authenticated` clause; replace `auth.email() = x` with `(auth.jwt() ->> 'email') = x`.

### Data updated in Supabase but a Next.js app still shows old rows
**Cause:** Next.js cached the response; the request never reached Supabase after your RLS/data change.
**Diagnose:** Check `edge_logs` — if the request isn't there, the response was served from cache.
**Fix:** Opt the affected route out of caching: `export const dynamic = 'force-dynamic'` or `export const revalidate = 0`.

### `insufficient privilege` reading `pg_stat_statements`
**Fix:** `grant pg_read_all_stats to postgres;`

## Find the exact permission error in the logs

Postgres errors are in the `postgres_logs` source (ClickHouse). Filter by SQL state:

```sql
select timestamp,
       log_attributes['parsed.user_name'] as role,
       log_attributes['parsed.query'] as query,
       log_attributes['parsed.detail'] as detail
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.sql_state_code'] = '42501'
order by timestamp desc
limit 100;
```

## Roles at a glance

- `anon` — unauthenticated; only what policies explicitly allow.
- `authenticated` — signed-in; `auth.uid()` is the user id. **Anonymous sign-ins also carry this role** — check `auth.jwt() ->> 'is_anonymous'` if you must distinguish them.
- `service_role` — server-only; **bypasses RLS entirely**, so adding it to a policy does nothing. Never ship the secret key to a client.

For RLS performance (wrapping `auth.uid()` in a subselect, indexing policy columns), use the **supabase-postgres-best-practices** skill.
