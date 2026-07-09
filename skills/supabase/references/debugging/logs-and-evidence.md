# Logs & evidence

Evidence comes first. Before hypothesizing, pull the logs for the failing layer, run the advisors, and inspect the schema. This file is the log-querying method the debugging loop relies on; the per-symptom causes and fixes live in the troubleshooting guides linked from [index.md](index.md).

## Query narrow, widen deliberately

This is the core discipline, and it holds regardless of which query engine backs the logs. Log volumes are enormous and, on paid projects, **billed by data scanned**; a broad scan buries the one line you need under everything you don't, and floods your context. This is **on-demand debugging**: query while you investigate, never poll in a loop. Efficient debugging resolves most issues in a handful of queries:

1. **Pick the one most-specific source** for the symptom (table below). Never scan every source at once. If you don't yet know which service owns the problem, identify it from the stack and status code *first*: that identification is half the job.
2. **Bound the window, but not too fresh.** Add a **`LIMIT`** and a time range, but avoid an ultra-recent window: querying just the last 1 to 5 minutes can scan far more than expected, because the newest rows haven't fully settled. Roughly the last 15 minutes is a good floor; widen to hours only as needed.
3. **Select only the fields you need**, and filter to the specific error on the top-level columns (`timestamp`, status, severity) *before* digging into nested metadata.
4. **Widen along an anchor, deliberately.** Once a query gives you an anchor (a timestamp, request id, or error code), pivot on it: query the adjacent source, filtered by that anchor, to follow the request across layers (for example `edge_logs` to `postgres_logs`). Broaden the window or loosen the filter only when a query comes up empty. Widening follows the thread; it is never a fresh scan of every source from scratch.

**The anti-pattern this discipline exists to kill:** `select *` with no source filter, no `LIMIT`, and a multi-day window across all services. It's slow, it costs scanned-GB, and it makes the root cause *harder* to find. Never open with an all-source dump.

For **recurring** export or monitoring, which is not one-off debugging, configure a **log drain** to stream logs to an external sink (Datadog, a webhook, and so on) instead of re-running queries on a schedule.

## How to read logs

**1. MCP `get_logs` — the primary path when the Supabase MCP server is connected.** It takes a service name, not SQL, so it is unaffected by which engine backs the logs — prefer it for "what just failed":

```
get_logs(project_id, service)
```

`service` is one of: `api`, `postgres`, `auth`, `storage`, `realtime`, `edge-function`, `branch-action`. It returns logs from the **last 24 hours**. For older or aggregated analysis, use the Logs Explorer.

> `get_logs` service names map to the Logs Explorer sources below: `api` → `edge_logs`, `postgres` → `postgres_logs`, `auth` → `auth_logs`, `edge-function` → `function_edge_logs`/`function_logs`.

**2. Logs Explorer (SQL) — for filtering, aggregation, and custom time ranges.**

> **Confirm the dialect before writing non-trivial SQL.** The Logs Explorer currently runs on **BigQuery**: each source is its own table (`edge_logs`, `postgres_logs`, …), and nested fields are reached by `cross join unnest(metadata)`. A migration of the logs backend to **ClickHouse** is in progress; when it lands, the model changes to a single `logs` table with a `log_attributes` map, and the `unnest` joins go away. The [logs docs](https://supabase.com/docs/guides/telemetry/logs.md) are authoritative and updated — read them for the exact current syntax and field names rather than trusting cached knowledge.

**Don't guess field names.** In BigQuery a wrong field errors; after the ClickHouse migration a missing map key silently returns `''`. Either way, confirm real field names from the docs field reference, or select `event_message` (always present, carries the full raw line) and a small sample first to see the real shape.

## Which source for which problem

| Problem | Source | Contains |
| --- | --- | --- |
| API request failed / HTTP error / latency | `edge_logs` | Gateway requests, status, method, path, client IP/geo |
| SQL error, RLS, slow query, pg_cron, webhooks (`pg_net`) | `postgres_logs` | Statements, severity, SQLSTATE, hints |
| Login/signup/token/OAuth/email | `auth_logs` | Auth events, token validation, errors |
| Edge Function request/response | `function_edge_logs` | Status, method, path, execution time, function id |
| Edge Function `console` output | `function_logs` | event_type, level, function id, execution id |
| Storage upload/download | `storage_logs` | Object activity |
| Realtime connections | `realtime_logs` | Channel/connection state |
| Pooler/PostgREST internals | `supavisor_logs`, `pgbouncer_logs`, `postgrest_logs` | Mostly `event_message` |

## Minimal Logs Explorer queries (BigQuery — current dialect)

Keep queries narrow: name the fields, filter first, cap the rows. BigQuery caps results at 1000 rows.

Failing API requests by status:
```sql
select timestamp, request.method, request.path, response.status_code
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
where response.status_code >= 400
order by timestamp desc
limit 100;
```

A specific Postgres SQLSTATE (e.g. `42501` permission denied, `42P01` relation missing, `23505` duplicate key):
```sql
select timestamp, event_message, parsed.error_severity, parsed.sql_state_code
from postgres_logs
  cross join unnest(metadata) as m
  cross join unnest(m.parsed) as parsed
where parsed.sql_state_code = '42501'
order by timestamp desc
limit 100;
```

To follow a request across layers, take the `timestamp` from the `edge_logs` row and read `postgres_logs` in a tight window around it. For the exact field paths per source (they differ by table), see [Interpret the Postgres logs](https://supabase.com/docs/guides/troubleshooting/how-to-interpret-and-explore-the-postgres-logs-OuCIOj) and [API errors in the logs](https://supabase.com/docs/guides/troubleshooting/discovering-and-interpreting-api-errors-in-the-logs-7xREI9).

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
