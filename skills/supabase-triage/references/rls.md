# RLS (Row Level Security) Triage

## RLS policy causes infinite recursion
**Symptom:** Postgres logs show `infinite recursion detected in policy for relation "table_name"` on a DB or Storage request.
**Cause:** A circular dependency between RLS policies — a policy on table A queries table B, and table B's policy (directly or transitively) queries back into table A.
**Fix:** Either break the circular reference in the policy definitions, or wrap the permission check in a `SECURITY DEFINER` function (runs with the creator's privileges, e.g. `postgres`, bypassing RLS on the target table and breaking the recursion).
Source: https://github.com/orgs/supabase/discussions/47525

## RLS Simplified (concept primer)
**Symptom:** Confusion about how `USING` vs `WITH CHECK` behave.
**Cause:** N/A — reference doc. `USING` is appended to the implicit `WHERE` clause for SELECT/UPDATE/DELETE visibility. `WITH CHECK` validates values being written (INSERT/UPDATE) — e.g. prevents a user from setting `user_id` to someone else's id on insert.
**Fix:** For UPDATE policies you generally need both `USING` (which rows can be touched) and `WITH CHECK` (what the row can become).
Source: https://github.com/orgs/supabase/discussions/29114

## RLS performance and best practices
**Symptom:** Queries got much slower after enabling RLS, especially on `SELECT`/`UPDATE` scanning many rows (LIMIT/OFFSET doesn't help — Postgres still evaluates RLS on every candidate row).
**Cause:** RLS predicates run per-row, and any joined tables referenced inside a policy also run their own RLS unless bypassed via a `SECURITY DEFINER` function.
**Fix:** Diagnose by comparing the query with RLS on vs. off in a non-prod environment. Then: (1) index columns used in RLS predicates that aren't already the PK (e.g. `create index on test_table using btree (user_id)` for a policy using `auth.uid() = user_id`), (2) wrap cross-table policy lookups in `SECURITY DEFINER` functions to avoid re-running RLS on joined tables.
Source: https://github.com/orgs/supabase/discussions/14576

## Service role key client still getting RLS errors / no data
**Symptom:** A client built with the service role key unexpectedly hits RLS denials or returns no rows.
**Cause:** RLS enforcement follows the `Authorization` header, not the `apikey` header — and something is overwriting the Authorization header with a user session/JWT instead of the service role key. Three common culprits: (1) an SSR client (designed to read the session from cookies) initialized with the service role — the cookie session silently overrides it; (2) server code (e.g. an Edge Function) explicitly setting `Authorization` to a user token in `createClient` options; (3) using `signUp()` or other client-side auth methods on a service-role client, which returns and installs a user session. Also: putting `service_role` in an RLS policy's `TO` clause does nothing — the service role never evaluates policies at all.
**Fix:** Use a dedicated `supabase-js` client for service-role/admin work, separate from any SSR/session-sharing client. For admin user creation use `admin.createUser()`, not `signUp()`.
Source: https://github.com/orgs/supabase/discussions/30146

## SELECT returns an empty array despite rows existing
**Symptom:** A query returns `[]` even though the table clearly has matching rows.
**Cause:** RLS is enabled with no policy (or the current role/JWT doesn't satisfy the policy) — not a query bug.
**Fix:** Temporarily disable RLS on the table (non-prod only) to confirm. To check whether you have an authenticated session at call time, create a debug RPC: `create function test_authorization_header() returns json language sql as $$ select auth.jwt(); $$;` then call it — if `role` comes back `anon` or `service_role`, there's no user session attached to the request. Drop the function afterward.
Source: https://github.com/orgs/supabase/discussions/12895

## Storage upload 403: 'new row violates row-level security policy'
**Symptom:** File upload fails with 403 even though the INSERT policy looks correct and the JWT is valid.
**Cause:** Storage's upload endpoint does `INSERT ... RETURNING *` — if there's no matching `SELECT` policy on `storage.objects` for the new row, the `RETURNING` clause can't read it back and the whole transaction is treated as a policy violation, even though the INSERT itself would have succeeded.
**Fix:** Add a `SELECT` RLS policy on `storage.objects` that mirrors the `INSERT` policy's conditions (same `auth.uid()`/bucket/path logic).
Source: https://github.com/orgs/supabase/discussions/47231

## 42501: permission denied for table http_request_queue
**Symptom:** `42501 permission denied for table http_request_queue` when using `pg_net`.
**Fix:** Check `select * from net.http_request_queue` is empty, then `drop extension pg_net; create extension pg_net schema extensions;`. If dependent objects block the drop, contact Supabase support.
Source: https://github.com/orgs/supabase/discussions/21450

## Do SECURITY DEFINER functions need to be exposed for RLS?
**Symptom:** Unsure whether a `SECURITY DEFINER` function used inside an RLS policy needs to be added to PostgREST's "Exposed Schemas" or "Extra Search Path" config.
**Fix:** No — PostgREST doesn't need to know about it as long as the policy references the function with its fully-qualified schema (e.g. `security.rls_func(...)`).
Source: https://github.com/orgs/supabase/discussions/16784
