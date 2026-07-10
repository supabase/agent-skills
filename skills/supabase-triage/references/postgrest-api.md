# PostgREST / API Triage

## 400 'column does not exist' only on mutations, with OR filters
**Symptom:** `column example_table.example_column does not exist` on PATCH/POST/DELETE with an `or=(...)` filter, while the identical filter works fine as a GET.
**Cause:** Known PostgREST bug (issue #3707) before v14.4 — the `or()` filter's column resolution logic incorrectly runs against the mutation plan.
**Fix:** Permanent: Project Settings → Infrastructure → upgrade Postgres (auto-upgrades PostgREST to 14.5+). Immediate workaround: explicitly include the referenced column in the mutation's `select=` parameter to force correct resolution.
Source: https://github.com/orgs/supabase/discussions/47412

## PGRST002: Could not query the database for the schema cache
**Symptom:** API requests fail with `PGRST002`.
**Cause:** A schema still listed in Data API's exposed-schemas config was dropped from the database — PostgREST can't build its schema cache with a missing schema in `db_schemas`.
**Fix:** Temporarily recreate the dropped schema to restore connectivity, remove it from Project Settings → Data API → Exposed Schemas, save, then drop it safely. If schemas were set manually via `ALTER ROLE authenticator SET pgrst.db_schemas`, the Dashboard no longer manages them — update via SQL: `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, example_schema'; NOTIFY pgrst, 'reload config';`
Source: https://github.com/orgs/supabase/discussions/46205

## PostgREST not recognizing objects even though schema is exposed
**Symptom:** `Could not find the table 'X' in the schema cache` despite the schema being in Exposed Schemas.
**Cause:** When multiple schemas are exposed, only the *first* one in the list is the default for unqualified names — this is intentional (avoids name collisions across schemas).
**Fix:** Either reorder so the desired schema is first, or explicitly qualify: `.schema('your_schema').from(...)`, or initialize the client with that schema as default.
Source: https://github.com/orgs/supabase/discussions/45145

## schema "pg_pgrst_no_exposed_schemas" does not exist
**Symptom:** This exact schema name shows up in PostgREST logs.
**Cause:** Harmless — appears when the Data API is disabled on the project (PostgREST isn't actually shut down, it just gets a placeholder empty-exposed-schemas value). Known cosmetic issue, doesn't affect the project.
Source: https://github.com/orgs/supabase/discussions/45144

## Database API 42501 errors (often surfaced as 401/403)
**Symptom:** Client sees 401/403; Postgres logs show SQL state `42501` (permission denied).
**Cause:** One of: (1) accessing a forbidden schema (`auth`/`vault` are never exposable to API roles — use a `SECURITY DEFINER` function if you truly need access); (2) a custom schema not yet granted to the Database API; (3) missing table-level grants — by default `public` tables grant SELECT/INSERT/UPDATE/DELETE to `anon`/`authenticated`, but this can be changed.
**Fix:** Query for the exact failing statement:
```sql
select cast(postgres_logs.timestamp as datetime) as timestamp, event_message, parsed.user_name, parsed.query, parsed.detail, parsed.hint
from postgres_logs cross join unnest(metadata) as metadata cross join unnest(metadata.parsed) as parsed
where regexp_contains(parsed.error_severity, 'ERROR|FATAL|PANIC') and parsed.sql_state_code = '42501'
order by timestamp desc limit 100;
```
Check current grants: `select grantee, privilege_type from information_schema.role_table_grants where table_name = '<table>';`
Source: https://github.com/orgs/supabase/discussions/31293

## HTTP status code reference
**2XX** success. **3XX** redirect required. **4XX** client-side issue (bad/missing auth, malformed request, rate limiting). **402** Fair Use Policy service restriction — description includes `exceeded_*` (e.g. `exceeded_egress_quota`, `exceeded_db_size_quota`) or `overdue_payment`; dashboard access to your data is preserved even while restricted. **5XX** server/project-side error.
Source: https://github.com/orgs/supabase/discussions/33288

## Operation too complex for the client libraries
**Symptom:** A query needs multiple joins/conditional logic the JS/client query builder can't express cleanly.
**Fix:** Write a Postgres stored function (`CREATE FUNCTION ... RETURNS TABLE (...) AS $$ ... $$ LANGUAGE plpgsql;`) and call it via `supabase.rpc('fn_name', { param: value })` instead of composing it client-side.
Source: https://github.com/orgs/supabase/discussions/21294
