---
name: supabase-debugging
description: >-
  Systematically debug Supabase errors and unexpected behavior by isolating the
  layer, gathering evidence from logs, and applying known fixes. Use when a
  Supabase app misbehaves or returns an error: a query returns an empty array or
  the wrong rows; a request fails with 401, 403, 404, 500, 503, 520, or 546; a
  Postgres or PostgREST error code appears (42501, 42P01, PGRST002, PGRST106,
  23505); RLS blocks or silently drops rows; auth sessions, JWTs, cookies, OAuth,
  OTP, or MFA break; "permission denied", "schema cache", "statement timeout",
  "too many connections", "prepared statement already exists", or "relation does
  not exist" appears; an Edge Function crashes, times out, or won't deploy;
  Realtime disconnects or drops messages; Storage uploads fail; or the user asks
  to read, interpret, or query Supabase logs (Logs Explorer, ClickHouse) to find
  the cause.
metadata:
  author: supabase
  version: "0.0.0"
---

# Debugging Supabase

Debug by **evidence**, not by guessing. A Supabase error almost always surfaces at one layer but originates at another — the fix comes from finding *where*, and the only reliable way to find where is to read the logs and the data, not to pattern-match the symptom. Retrying a failed command rarely fixes anything; **isolate the layer** first.

## The debugging loop

Run this loop. Do not skip to a fix before you have evidence for the cause.

1. **Reproduce and read the error precisely.** Capture the exact status code, the error code, and the full message — not a paraphrase. `401` ≠ `403`; `PGRST002` ≠ `PGRST106`; a Postgres `SQLSTATE` (`42501`, `42P01`, `23505`) points at the exact failure. The precise error is the single strongest clue; treat a vague "it doesn't work" as step-0-incomplete and pin down the observable first.
2. **Locate the failing layer** in the request stack below. The status code and error code usually name it.
3. **Gather evidence** for that layer — query the logs, run advisors, inspect the schema or metrics. See [references/logs-and-evidence.md](references/logs-and-evidence.md). Logs are the primary tool: Supabase logs live in one ClickHouse `logs` table, one `source` per service.
4. **Isolate the cause** using the layer's reference file (routing table below). Confirm the hypothesis against evidence before acting — most Supabase bugs have a small set of known causes, and the reference tells you how to tell them apart.
5. **Apply the fix**, then **verify**: re-run the exact operation that failed and confirm it now succeeds *and* that the corresponding log line is clean. A fix you have not re-run is a guess. If two or three attempts do not resolve it, stop and re-gather evidence — do not loop on the same command.

## The Supabase request stack

An API call from a client passes through several layers. Errors propagate up, so the layer that *reports* the error is often not the one that *caused* it. Isolating the layer is the core move.

```
Client (supabase-js / SSR)
  → Edge / API gateway            → edge_logs            (HTTP status, routing, rate limits)
  → PostgREST (Data/REST API)     → postgrest_logs       (PGRST* codes, schema cache)
  → GoTrue (Auth)                 → auth_logs            (login, JWT, OAuth, email)
  → Storage API                   → storage_logs         (uploads, object access)
  → Realtime                      → realtime_logs        (channels, presence, broadcast)
  → Supavisor (connection pooler) → supavisor_logs       (pooling, timeouts)
  → Postgres (SQL, RLS, triggers) → postgres_logs        (SQLSTATE, RLS, functions)
```

Edge Functions run separately: `function_edge_logs` (the HTTP request to the function) and `function_logs` (`console` output from inside it).

**A permission or empty-result error at the API layer is almost always a Postgres RLS or privilege problem one layer down.** Trace toward the database.

## Symptom → reference routing

Match the symptom to the layer, then read that file for the specific cause and fix. When a symptom fits two layers (e.g. an auth call failing with an RLS error), read both, starting with the one nearest the database.

| Symptom / error | Layer | Read |
| --- | --- | --- |
| Empty `data` array with rows present; wrong rows returned; UPDATE/DELETE affects 0 rows; `42501` permission denied; `service_role` still blocked; policy not matching | RLS & access | [references/rls-and-access.md](references/rls-and-access.md) |
| `PGRST002`/`PGRST106`; "schema cache"; "could not find table/relationship"; new column/table not recognized; `42P01` relation does not exist; `520`; API call returns nothing | Data API (PostgREST) | [references/data-api.md](references/data-api.md) |
| Login/logout/session broken; JWT "invalid claim"/"missing sub"; cookies not sent; OAuth redirect wrong; OTP/magic-link expired; MFA/TOTP fails; auth `500`/`503`; emails not arriving | Auth | [references/auth.md](references/auth.md) |
| `statement timeout`; duplicate key / sequence; `prepared statement already exists`; trigger errors; slow `ALTER`/query; blocked queries; disk/memory/swap; index size | Database (Postgres) | [references/database.md](references/database.md) |
| "too many connections"; "remaining connection slots"; `CONNECT_TIMEOUT`; pooler vs direct; transaction-mode read-only; `no pg_hba.conf entry`; IPv4/IPv6; SASL/SCRAM | Connections & pooler | [references/connections.md](references/connections.md) |
| Edge Function `401`/`404`/`500`/`503`/`504`/`546`; CPU/memory/wall-clock limit; won't deploy; boot error; WebSocket drop; `esm.sh` import fails | Edge Functions | [references/edge-functions.md](references/edge-functions.md) |
| Realtime `TIMED_OUT`; `TooManyChannels`; silent disconnect; missed DB changes; broadcast-from-DB warning; heartbeats | Realtime | [references/realtime.md](references/realtime.md) |
| Upload/list fails; public bucket inaccessible; `relation "objects" does not exist`; file-size limit; folder/RLS | Storage | [references/storage.md](references/storage.md) |
| Webhook not firing; `pg_cron` job not running; `pg_net` queue stuck | Database jobs | [references/logs-and-evidence.md](references/logs-and-evidence.md) |
| Need to read/query logs, interpret Postgres logs, run advisors, or read metrics | Diagnostics | [references/logs-and-evidence.md](references/logs-and-evidence.md) |

For query performance and schema-design optimization (indexes, `EXPLAIN`, N+1, partitioning), use the **supabase-postgres-best-practices** skill — this skill covers *diagnosing* the failure, that one covers *optimizing* the design.

## Verify before declaring done

Debugging is complete only when the failing operation has been re-run and succeeds, and the layer's log shows the clean result. State what you changed, why the evidence pointed there, and how you confirmed the fix.

## Skill feedback

If this skill gave incorrect guidance or missed a case, tell the user they can open an issue at `https://github.com/supabase/agent-skills/issues/new` — name the reference file and symptom that were wrong.
