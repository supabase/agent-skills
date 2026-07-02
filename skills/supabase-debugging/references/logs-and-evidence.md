# Logs & evidence

Evidence comes first. Before hypothesizing, pull the logs for the failing layer, run the advisors, and inspect the schema. This file is the diagnostic toolkit the rest of the skill relies on.

## Two ways to read logs

**1. MCP `get_logs` — fastest, when the Supabase MCP server is connected.** One call, by service:

```
get_logs(project_id, service)
```

`service` is one of: `api`, `postgres`, `auth`, `storage`, `realtime`, `edge-function`, `branch-action`. It returns a **limited recent window**, so it's ideal for "what just failed" but not for historical or aggregated analysis — for that, use the Logs Explorer.

> `get_logs` service names differ from the Logs Explorer `source` names below: `api` → `edge_logs`, `postgres` → `postgres_logs`, `auth` → `auth_logs`, `edge-function` → `function_edge_logs`/`function_logs`.

**2. Logs Explorer (ClickHouse SQL) — most powerful.** Write a query for exactly what you need: filter, aggregate, search across a chosen time range. Everything below is this path.

> **Watch out:** many troubleshooting docs and older blog posts show the **BigQuery** syntax — `... from postgres_logs cross join unnest(metadata) as m cross join unnest(m.parsed) as parsed where parsed.sql_state_code = ...`. That engine is retired. The logs now live in **ClickHouse**; translate every `cross join unnest(...)` into a single `log_attributes['...']` lookup (below).

## The `logs` table

Every log line from every service is one row in a single ClickHouse `logs` table, tagged by `source`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String | Unique log id |
| `timestamp` | DateTime64 (UTC) | ISO 8601, microsecond precision — compare/order directly |
| `event_message` | String | The raw log line |
| `severity_text` | String | Level, when the source sets one |
| `source` | String | The service — **always filter on this** |
| `log_attributes` | Map(String, String) | Structured per-source fields, dotted keys |

**Rules for correct, cheap queries:**
- **Always filter by `source`** and **always add a `LIMIT`** — the tables are huge.
- Use **`count()`**, never `count(*)` or `select *` (the endpoint rejects both).
- Keep the time range tight; `order by timestamp desc` for most-recent-first.
- Read structured fields with bracket access: `log_attributes['request.path']`. Keys keep the full dotted path (`request.cf.country`, not `cf.country`).
- Map values are **strings** — wrap numbers in `toInt32OrZero(...)` (returns 0 on missing/non-numeric, so it never errors on partial data).

Minimal query:
```sql
select timestamp, event_message
from logs
where source = 'edge_logs'
order by timestamp desc
limit 100;
```

## Which source for which problem

| Problem | `source` | Contains |
| --- | --- | --- |
| API request failed / HTTP error / latency | `edge_logs` | Gateway requests, status, method, path, client IP/geo |
| SQL error, RLS, slow query, pg_cron, webhooks (`pg_net`) | `postgres_logs` | Statements, severity, SQLSTATE, hints |
| Login/signup/token/OAuth/email | `auth_logs` | Auth events, token validation, errors |
| Edge Function request/response | `function_edge_logs` | Status, method, path, execution time, function id |
| Edge Function `console` output | `function_logs` | event_type, level, function id, execution id |
| Storage upload/download | `storage_logs` | Object activity |
| Realtime connections | `realtime_logs` | Channel/connection state |
| Pooler/PostgREST internals | `supavisor_logs`, `pgbouncer_logs`, `postgrest_logs` | Mostly `event_message` |

## Common `log_attributes` keys

- **`edge_logs`**: `request.method`, `request.path`, `request.search`, `response.status_code`, `identifier`, `request.cf.country`, `request.headers.user_agent`
- **`postgres_logs`**: `parsed.error_severity`, `parsed.sql_state_code`, `parsed.query`, `parsed.detail`, `parsed.hint`, `parsed.user_name`, `parsed.application_name`, `identifier`
- **`auth_logs`**: `level`, `status`, `path`, `msg`, `error`
- **`function_edge_logs`**: `response.status_code`, `request.method`, `request.pathname`, `function_id`, `execution_id`, `execution_time_ms`
- **`function_logs`**: `event_type`, `level`, `function_id`, `execution_id`

**Discover keys from real data** instead of guessing:
```sql
select arrayJoin(mapKeys(log_attributes)) as key, count() as n
from logs
where source = 'postgres_logs'
group by key order by n desc limit 100;
```

## Essential diagnostic queries

Failing API requests by status:
```sql
select timestamp,
       toInt32OrZero(log_attributes['response.status_code']) as status,
       log_attributes['request.method'] as method,
       log_attributes['request.path'] as path
from logs
where source = 'edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) >= 400
order by timestamp desc limit 100;
```

Postgres errors by severity:
```sql
select log_attributes['parsed.error_severity'] as severity, count() as n
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.error_severity'] in ('ERROR','FATAL','PANIC')
group by severity order by n desc limit 100;
```

A specific SQLSTATE (e.g. `42501` permission denied, `42P01` relation missing, `23505` duplicate key):
```sql
select timestamp,
       log_attributes['parsed.user_name'] as role,
       log_attributes['parsed.query'] as query,
       log_attributes['parsed.detail'] as detail
from logs
where source = 'postgres_logs'
  and log_attributes['parsed.sql_state_code'] = '42501'
order by timestamp desc limit 100;
```

Auth errors:
```sql
select timestamp, event_message, log_attributes['msg'] as message
from logs
where source = 'auth_logs'
  and log_attributes['level'] in ('error','fatal')
order by timestamp desc limit 100;
```

Free-text search a raw message:
```sql
select timestamp, event_message
from logs
where source = 'postgres_logs' and event_message ilike '%deadlock%'
order by timestamp desc limit 100;
```

ClickHouse function substitutions: `count()` (not `count(*)`), `match(x,'p')` (regex), `x ilike '%p%'` (substring), `toInt32OrZero(x)` (numeric), `mapKeys(log_attributes)` (keys).

## Advisors — run these on any schema/security bug

Advisors are built-in security and performance linters. Run **`get_advisors(project_id, type)`** with `type: security` or `type: performance` (or `supabase db advisors` via CLI). The security advisor catches the classics: tables without RLS, `security definer` views, function search-path issues, exposed materialized views. Run it after any DDL and after any RLS change.

## Inspect the schema

- **`list_tables(project_id, verbose: true)`** — shows every table with **RLS-enabled status**, row counts, columns, and foreign keys. The fastest way to confirm "is RLS on here?" and "does this FK exist?".
- **`execute_sql(project_id, query)`** — run any diagnostic SQL directly (the `pg_class`, `pg_policies`, `information_schema` checks used throughout this skill).
- **`list_extensions`**, **`list_migrations`** — confirm an extension is installed / a migration applied.

## Metrics & resources

View metrics via the dashboard **Reports** (hourly averages) or a **Grafana** dashboard (per-second). Reading them:

- **Memory chart:** yellow = active RAM, blue = cache/buffers (good — this is why cache-hit rate matters), green = free, **red = swap**. High swap alone is *not* a problem; it's concerning only when active RAM is also sustained high (>~75–85%). Aim for a ~99% cache-hit rate (`select * from ...` via `supabase inspect db cache-hit --linked`).
- **IO chart:** each compute size has a baseline and a burst IOPS/throughput limit. Sustained near-peak IOPS or high CPU IOWait means the disk is the bottleneck — usually from sequential scans (missing indexes), too little cache, heavy RLS joins, or bloat.

Remediate IO/memory strain by adding indexes, raising compute, adding a read replica, or partitioning — see the **supabase-postgres-best-practices** skill.

## Postgres logging levels

Default is `WARNING`. **Never leave `DEBUG`/`INFO`/`NOTICE` on** — they flood the disk and can cause IO lockups. Check and set:
```sql
show log_min_messages;
alter role postgres set log_min_messages to 'WARNING';   -- or 'ERROR' for production
alter role postgres reset log_min_messages;
```

## EXPLAIN

`explain analyze <query>` reveals the real plan and timings; paste large plans into `explain.depesz.com`. Look for `Seq Scan` on big tables (missing index) and big gaps between estimated vs actual rows (stale stats — `analyze <table>`). For plans *inside* a function, use `auto_explain` in a rolled-back transaction:
```sql
begin;
set local auto_explain.log_min_duration = '0';
set local auto_explain.log_analyze = true;
set local auto_explain.log_nested_statements = true;
select your_function();
rollback;   -- plan appears in postgres_logs
```
For turning a diagnosed slow query into an optimized one, use the **supabase-postgres-best-practices** skill.

## Supabase-specific HTTP status codes

Beyond the standard codes, Supabase's gateway emits a few custom ones:

- **402** — Fair-Use restriction (quota exceeded or payment overdue).
- **540** — Project is **paused**; it can't serve requests until restored.
- **544** — Gateway timeout guard (a query ran too long).
- **546** — Edge Function resource limit (CPU/memory) — see [edge-functions.md](edge-functions.md).

## pg_cron & webhook health checks

Webhooks (`pg_net`) and `pg_cron` fail silently when their background worker dies. Confirm the worker is alive before debugging logic.

Webhook worker:
```sql
select pid from pg_stat_activity where backend_type ilike '%pg_net%';
select net.worker_restart();                    -- worker dead? (pg_net 0.8+; older versions: fast-reboot the project instead)
select * from net._http_response where status_code >= 400 order by created desc;   -- recent failures
```
If `net.http_request_queue` grows large (`select count(*) from net.http_request_queue;`) it's flooded — raise compute. Truncating it (`truncate net.http_request_queue;`) clears the backlog but **permanently drops every undelivered webhook call**, so reach for it only when you accept that loss.

pg_cron scheduler:
```sql
select pid, state, query from pg_stat_activity where application_name ilike 'pg_cron scheduler';
select * from cron.job_run_details
where status not in ('succeeded','running') and start_time > now() - interval '5 days'
order by start_time desc limit 10;
```
No scheduler row → reboot the project (Settings → General → Fast Reboot). Max 32 concurrent cron jobs.
