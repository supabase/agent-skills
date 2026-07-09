# Logs & evidence

Evidence comes first. Before hypothesizing, pull the logs for the failing layer, run the advisors, and inspect the schema. This file is the log-querying method the debugging loop relies on; the per-symptom causes and fixes live in the troubleshooting guides linked from [index.md](index.md).

## Query narrow, widen deliberately

This is the core discipline, and it holds regardless of which query engine backs the logs. Log volumes are enormous and, on paid projects, **billed by data scanned**; a broad scan buries the one line you need under everything you don't, and floods your context. This is **on-demand debugging**: query while you investigate, never poll in a loop. Efficient debugging resolves most issues in a handful of queries:

1. **Pick the one most-specific `source`** for the symptom (table below). Never scan every source at once. If you don't yet know which service owns the problem, identify it from the stack and status code *first*: that identification is half the job.
2. **Bound the window, but not too fresh.** Add a **`LIMIT`** and a time range, but avoid an ultra-recent window: querying just the last 1 to 5 minutes can scan far more than expected, because the newest rows haven't fully settled. Roughly the last 15 minutes is a good floor; widen to hours only as needed.
3. **Select only the columns you need**, and filter to the specific error on the real columns (`source`, `timestamp`, a status or `sql_state_code`) *before* reaching into `log_attributes`.
4. **Widen along an anchor, deliberately.** Once a query gives you an anchor (a timestamp, request id, or error code), pivot on it: query the adjacent source, filtered by that anchor, to follow the request across layers (for example `edge_logs` to `postgres_logs`). Broaden the window or loosen the filter only when a query comes up empty. Widening follows the thread; it is never a fresh scan of every source from scratch.

**The anti-pattern this discipline exists to kill:** `select *` with no `source`, no `LIMIT`, and a multi-day window across all services. It's slow, it costs scanned-GB, and it makes the root cause *harder* to find. Never open with an all-source dump.

For **recurring** export or monitoring, which is not one-off debugging, configure a **log drain** to stream logs to an external sink (Datadog, a webhook, and so on) instead of re-running queries on a schedule.

## How to read logs

**1. MCP `get_logs` — the primary path when the Supabase MCP server is connected.** It takes a service name, not SQL, so it works regardless of the query engine — prefer it for "what just failed":

```
get_logs(project_id, service)
```

`service` is one of: `api`, `postgres`, `auth`, `storage`, `realtime`, `edge-function`, `branch-action`. It returns logs from the **last 24 hours**. For older or aggregated analysis, use the Logs Explorer.

> `get_logs` service names map to the Logs Explorer `source` names below: `api` → `edge_logs`, `postgres` → `postgres_logs`, `auth` → `auth_logs`, `edge-function` → `function_edge_logs`/`function_logs`.

**2. Logs Explorer (SQL) — for filtering, aggregation, and custom time ranges.**

> The Logs Explorer now defaults to **ClickHouse**: a single `logs` table tagged by `source`, with structured fields in a `log_attributes` map (below). Legacy projects not yet migrated use **BigQuery**, where each source is its own table (`edge_logs`, `postgres_logs`, …) queried with `cross join unnest(metadata)`; the public [logs docs](https://supabase.com/docs/guides/telemetry/logs.md) still show that older syntax and lag the current default. If a ClickHouse query errors with "table `logs` not found", the project is still on BigQuery.

## The `logs` table (ClickHouse)

Every log line from every service is one row in a single `logs` table, tagged by `source`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String | Unique log id |
| `timestamp` | DateTime64 (UTC) | ISO 8601, microsecond precision — compare/order directly |
| `event_message` | String | The raw log line |
| `severity_text` | String | Level, when the source sets one |
| `source` | String | The service — **always filter on this** |
| `log_attributes` | Map(String, String) | Structured per-source fields, dotted keys |

**Query mechanics** (the narrow-first discipline above is the *method*; these are the *syntax* rules):
- **List only the columns you need**, never `select *` (the endpoint rejects it, and an edge-log event carries ~40 fields, so naming columns sharply cuts bytes scanned). Use `count()`, not `count(*)`, and `order by timestamp desc` for most-recent-first.
- Read structured fields with bracket access: `log_attributes['request.path']`. Keys keep the full dotted path (`request.cf.country`, not `cf.country`).
- Map values are **strings**, so wrap numbers in `toInt32OrZero(...)`, which returns 0 on missing or non-numeric input and so never errors on partial data.
- **Don't invent `log_attributes` keys.** A missing key silently returns `''` and never an error, so a guessed key makes a working query look like it found nothing. Use only the confirmed keys below; for anything else (statement text, error detail, an Edge Function shutdown reason), select `event_message` (always present, carries the full line), or run the `mapKeys` discovery query first to see what a source actually sets.
- Function substitutions vs standard SQL: `count()` (not `count(*)`), `match(x,'p')` (regex), `x ilike '%p%'` (substring), `toInt32OrZero(x)` (numeric), `mapKeys(log_attributes)` (keys).

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
- **`postgres_logs`**: `parsed.error_severity`, `parsed.sql_state_code`, `parsed.user_name`, `parsed.database_name`, `parsed.query_id`, `identifier` — the statement text and error detail live in `event_message`, not in a `parsed.*` key (`parsed.query`/`parsed.detail` are almost always empty)
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

A specific SQLSTATE (e.g. `42501` permission denied, `42P01` relation missing, `23505` duplicate key):
```sql
select timestamp,
       log_attributes['parsed.user_name'] as role,
       log_attributes['parsed.error_severity'] as severity,
       event_message
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

Once a query gives you an anchor (timestamp, request id, SQLSTATE), pivot to the adjacent source filtered by it — for a failing API call, take the `timestamp` from `edge_logs` and read `postgres_logs` in a tight window around it.

## Advisors — run these on any schema/security bug

Advisors are built-in security and performance linters. Run **`get_advisors(project_id, type)`** with `type: security` or `type: performance` (or `supabase db advisors` via CLI). The security advisor catches the classics: tables without RLS, `security definer` views, function search-path issues, exposed materialized views. Run it after any DDL change and after any RLS change.

## Inspect the schema

- **`list_tables(project_id, verbose: true)`** — shows every table with **RLS-enabled status**, row counts, columns, and foreign keys. The fastest way to confirm "is RLS on here?" and "does this FK exist?".
- **`execute_sql(project_id, query)`** — run any diagnostic SQL directly (`pg_class`, `pg_policies`, `information_schema` checks).
- **`list_extensions`**, **`list_migrations`** — confirm an extension is installed / a migration applied.

## Deeper diagnostics — read the guide

These have dedicated troubleshooting guides that stay current; fetch the relevant one as Markdown (append `.md`) rather than working from memory.

- **Supabase-specific HTTP status codes** (`402` fair-use, `540` paused, `544` gateway timeout guard, `546` Edge Function resource limit): [HTTP status codes](https://supabase.com/docs/guides/troubleshooting/http-status-codes).
- **Metrics & resources** (Reports, Grafana, memory/IO/CPU charts): [View DB metrics](https://supabase.com/docs/guides/troubleshooting/how-to-view-database-metrics-uqf2z_), [Memory charts](https://supabase.com/docs/guides/troubleshooting/supabase-grafana-memory-charts), [IO charts](https://supabase.com/docs/guides/troubleshooting/interpreting-supabase-grafana-io-charts-MUynDR), [High CPU](https://supabase.com/docs/guides/troubleshooting/high-cpu-usage). Remediate IO/memory strain (indexes, compute, read replica, partitioning) with the **supabase-postgres-best-practices** skill.
- **Postgres logging levels** (never leave `DEBUG`/`INFO`/`NOTICE` on — they flood the disk): [Logging levels](https://supabase.com/docs/guides/troubleshooting/understanding-postgresql-logging-levels-and-how-they-impact-your-project-KXiJRm).
- **EXPLAIN and query plans**: [Understanding EXPLAIN](https://supabase.com/docs/guides/troubleshooting/understanding-postgresql-explain-output-Un9dqX), [EXPLAIN on functions](https://supabase.com/docs/guides/troubleshooting/running-explain-analyze-on-functions). For turning a diagnosed slow query into an optimized one, use the **supabase-postgres-best-practices** skill.
- **pg_cron & webhook health** (`pg_net`/`pg_cron` fail silently when their worker dies): [Webhook debugging](https://supabase.com/docs/guides/troubleshooting/webhook-debugging-guide-M8sk47), [pg_cron debugging](https://supabase.com/docs/guides/troubleshooting/pgcron-debugging-guide-n1KTaz).
