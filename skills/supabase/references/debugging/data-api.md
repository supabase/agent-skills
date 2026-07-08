# Data API (PostgREST)

The Data API is PostgREST in front of Postgres. Its errors come in two families: **`PGRST*`** codes (PostgREST itself — usually the schema cache) and **Postgres `SQLSTATE`** codes surfaced through the API (`42P01`, `42501`, `23505`). A `PGRST` code means "PostgREST couldn't build or use its view of your schema"; a five-character SQLSTATE means the database rejected the statement.

Check the `edge_logs` source first for the HTTP status, then `postgres_logs` for the underlying SQL error.

## Schema cache errors (the most common Data API failure)

PostgREST caches your schema. After a DDL change (new table, column, view, function, or foreign key), the cache can go stale, so the API 404s or 400s on objects that clearly exist.

### `Could not find the table/column/relationship ... in the schema cache` / new object not recognized
**Cause:** Stale PostgREST schema cache.
**Fix:** Reload it from the SQL editor (no restart needed):
```sql
notify pgrst, 'reload schema';
```
If the reload doesn't take, a long-idle transaction may be saturating the Postgres `NOTIFY` queue, so the `pgrst` channel never gets the signal. Check how full it is, then clear the blocker:
```sql
select pg_notification_queue_usage();   -- fraction of the async-notify queue in use (0.0–1.0), read-only
-- near 1.0? find and end the idle transaction holding it:
select pid, state, xact_start from pg_stat_activity where state = 'idle in transaction' order by xact_start;
-- select pg_terminate_backend(<pid>);  then re-issue: notify pgrst, 'reload schema';
```

### `PGRST002: Could not query the database for the schema cache`
**Cause:** A schema listed in **Data API → Exposed schemas** was dropped, so PostgREST can't build its cache at all (the entire API is down, not just one table).
**Fix:** Recreate the missing schema, remove it from Exposed Schemas in the dashboard, then drop it — in that order. If you manage schemas via the role setting: `alter role authenticator set pgrst.db_schemas = 'public'; notify pgrst, 'reload config';`

### `PGRST106: The schema must be one of the following ...`
**Cause:** You queried a schema that isn't in the `authenticator` role's exposed list.
**Fix:** Add it in **Data API → Exposed schemas**, or `alter role authenticator set pgrst.db_schemas = 'public, your_schema';` then `notify pgrst, 'reload config';`. From the client, target it explicitly with `supabase.schema('your_schema')`.

### Object exists but resolves against the wrong schema
**Cause:** With multiple exposed schemas, unqualified names resolve against the **first** one in the list.
**Fix:** Put the intended schema first, or always qualify: `supabase.schema('your_schema').from('table')`.

## Postgres errors surfaced through the API

### `42P01: relation "..." does not exist`
**Cause:** The object sits in an unexposed or custom schema, the name's case doesn't match, or it truly doesn't exist.
**Fix:** Qualify the schema (`supabase.schema('myschema').from('mytable')`); confirm the name with `select * from information_schema.tables where table_name ilike 'yourtable';`; avoid quoted mixed-case names (rename to lowercase). For `auth`/`vault`, go through a `security definer` function, never direct access.

### `42501: permission denied` → see [rls-and-access.md](rls-and-access.md)
A `42501` at the API layer is a database privilege/RLS problem. Don't debug it as an API bug.

### `23505: duplicate key value violates unique constraint` → see [database.md](database.md)
Usually a desynced sequence after an import.

## HTTP-level errors

### `520` (Cloudflare "unknown error")
**Cause:** The request URL/headers exceed ~16KB — typically a huge `in.(...)` filter with thousands of values.
**Fix:** Move the payload out of the URL into an RPC body:
```sql
create or replace function example(ids uuid[]) returns setof your_table language sql as $$
  select * from your_table where id = any(ids);
$$;
```
Call with `supabase.rpc('example', { ids: [...] })`.

### `400 column "..." does not exist` — only on PATCH/POST/DELETE, fine on GET
**Cause:** A known PostgREST bug (fixed in 14.4) mis-resolves a column when an `or()` filter is used on a **mutation**; the identical filter works on a `SELECT`.
**Diagnose:** Re-run the same filter as a GET — if it succeeds but the mutation 400s, this is the cause. Check the PostgREST version under Project Settings → Infrastructure.
**Fix:** As an immediate workaround, add the column to `select`: `PATCH /rest/v1/t?or=(col.eq.a,col.eq.b)&select=id,col`. For a permanent fix, upgrade Postgres (which pulls in a fixed PostgREST).

### API call "returns nothing" / hangs
**Cause:** An empty result from RLS (see [rls-and-access.md](rls-and-access.md)); a cached response (Next.js — see the caching entry in rls-and-access.md); or the request never left the client. Confirm what happened in `edge_logs`.

### A query is too complex for the client builder
**Fix:** Push it into a database function and call it via `supabase.rpc(...)`. This is the sanctioned escape hatch for multi-join/aggregate logic, and it also sidesteps the 16KB URL limit.

## Find API errors in the logs

Failing API requests (ClickHouse `edge_logs`):

```sql
select timestamp,
       toInt32OrZero(log_attributes['response.status_code']) as status,
       log_attributes['request.method'] as method,
       log_attributes['request.path'] as path
from logs
where source = 'edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) >= 400
order by timestamp desc
limit 100;
```

Then correlate with the database error in `postgres_logs` (see the SQLSTATE query in [rls-and-access.md](rls-and-access.md)).

## `PGRST` code reference

| Code | Meaning | Fix |
| --- | --- | --- |
| `PGRST002` | Can't build schema cache (an exposed schema was dropped) | Recreate schema, remove from Exposed Schemas, then drop |
| `PGRST106` | Requested schema not in the exposed list | Add to Exposed Schemas / `pgrst.db_schemas` |
| `PGRST202` | Function not found in schema cache (bad name/args or stale cache) | Check signature; `notify pgrst, 'reload schema'` |
| `PGRST204` | Column not found in schema cache | `notify pgrst, 'reload schema'` |
| `PGRST301` | JWT/role issue reaching the API | See [auth.md](auth.md) |

For the full PostgREST error list, fetch `https://supabase.com/docs/guides/api/rest/debugging.md` or search the docs.
