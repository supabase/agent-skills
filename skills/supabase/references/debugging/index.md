# Debugging Supabase

Debug by **evidence**, not by guessing. A Supabase error almost always surfaces at one layer but originates at another — find *where* by reading the logs and the data, not by pattern-matching the symptom. Retrying a failed command rarely fixes anything; **isolate the layer** first.

## The debugging loop

Run this loop. Do not skip to a fix before you have evidence for the cause.

1. **Reproduce and read the error precisely.** Capture the exact status code, the error code, and the full message — not a paraphrase. `401` ≠ `403`; `PGRST002` ≠ `PGRST106`; a Postgres `SQLSTATE` (`42501`, `42P01`, `23505`) points at the exact failure. The precise error is the single strongest clue; treat a vague "it doesn't work" as step-0-incomplete and pin down the observable first. With `supabase-js` the error is **returned, not thrown** — it's in the `error` of `{ data, error }`, so confirm the code actually inspects `error`; a swallowed `error` is why many bugs look like "nothing happened".
2. **Locate the failing layer** in the request stack below. The status code and error code usually name it.
3. **Gather evidence** for that layer: query the logs, run advisors, inspect the schema or metrics. Logs are the primary tool: Supabase logs are grouped by `source`, one per service. **Query narrow: one specific source, a bounded time window, only the fields you need, and widen only when it comes up empty.** A broad, all-source scan buries the signal, bloats your context, and costs scanned data; it is the default failure mode this workflow exists to prevent. See [logs-and-evidence.md](logs-and-evidence.md).
4. **Isolate the cause** using the layer's troubleshooting guide (routing table below). Confirm the hypothesis against evidence before acting — most Supabase bugs trace to a small set of known causes, and the guide tells you how to tell them apart.
5. **Apply the fix**, then **verify**: re-run the exact operation that failed and confirm it now succeeds *and* that the corresponding log line is clean. A fix you have not re-run is a guess. If two or three attempts do not resolve it, stop and re-gather evidence — do not loop on the same command.

## The Supabase request stack

An API call from a client passes through several layers. Errors propagate up, so the layer that *reports* the error is often not the layer that *caused* it. Isolating the layer is the core move.

```
Client (supabase-js / SSR)
  → Edge / API gateway → edge_logs (HTTP status, routing, rate limits)
      the gateway routes to ONE of these parallel services (they are not chained):
      ├→ PostgREST (Data/REST API) → postgrest_logs (low-signal; PGRST* evidence is in edge_logs + postgres_logs)
      ├→ GoTrue (Auth)             → auth_logs      (login, JWT, OAuth, email)
      ├→ Storage API               → storage_logs   (uploads, object access)
      └→ Realtime                  → realtime_logs  (channels, presence, broadcast)
  PostgREST, GoTrue, and Storage each reach the database on their own:
  → Supavisor (connection pooler) → supavisor_logs (pooling, timeouts)
  → Postgres (SQL, RLS, triggers) → postgres_logs  (SQLSTATE, RLS, functions)
```

Edge Functions run separately: `function_edge_logs` (the HTTP request to the function) and `function_logs` (`console` output from inside it).

**A permission or empty-result error at the API layer is almost always a Postgres RLS or privilege problem one layer down.** Trace toward the database.

## Symptom → layer routing

Match the symptom to the layer, check that layer's log `source` for evidence (see [logs-and-evidence.md](logs-and-evidence.md)), then find the troubleshooting guide for the specific cause and fix. When a symptom fits two layers (e.g. an auth call failing with an RLS error), start with the one nearest the database.

**Find the guide; don't hardcode it.** This table maps a symptom to its layer and log `source` only. For the specific cause and fix, look up the *current* troubleshooting guide rather than relying on cached knowledge: use the MCP `search_docs` tool with the exact error string, or browse the [troubleshooting index](https://supabase.com/docs/guides/troubleshooting). The [Debugging guide](https://supabase.com/docs/guides/telemetry/debugging) is the overview and routes to the per-symptom guides. Fetch any guide as Markdown by appending `.md`. Keeping the guide list in the docs (not in this file) means there is one source of truth to maintain, not two.

| Symptom / error | Layer | Log source |
| --- | --- | --- |
| Empty `data` array with rows present; wrong rows; UPDATE/DELETE affects 0 rows; `42501` permission denied; `service_role` still blocked; policy not matching | RLS & access | `postgres_logs` |
| `PGRST002`/`PGRST106`; "schema cache"; "could not find table/relationship"; new column/table not recognized; `42P01`; `520`; API returns nothing | Data API (PostgREST) | `edge_logs`, `postgres_logs` |
| Login/logout/session broken; JWT "invalid claim"/"missing sub"; cookies not sent; OAuth redirect wrong; OTP/magic-link expired; MFA/TOTP fails; auth `500`/`503`; emails not arriving | Auth (GoTrue) | `auth_logs`, `postgres_logs` |
| `statement timeout`; duplicate key / sequence; trigger errors; slow `ALTER`; blocked queries; disk/memory/swap; index size | Database (Postgres) | `postgres_logs` |
| "too many connections"; "remaining connection slots"; `CONNECT_TIMEOUT`; pooler vs direct; read-only transaction; `prepared statement already exists`; `no pg_hba.conf entry`; IPv4/IPv6; SASL/SCRAM | Connections & pooler | `supavisor_logs`, `postgres_logs` |
| Edge Function `401`/`404`/`500`/`503`/`504`/`546`; CPU/memory/wall-clock limit; won't deploy; boot error; WebSocket drop; `esm.sh` import fails | Edge Functions | `function_edge_logs`, `function_logs` |
| Realtime `TIMED_OUT`; `TooManyChannels`; silent disconnect; missed DB changes; broadcast-from-DB warning; heartbeats | Realtime | `realtime_logs` |
| Upload/list fails; public bucket inaccessible; `relation "objects" does not exist`; file-size limit; folder/RLS | Storage | `storage_logs`, `postgres_logs` |
| Webhook not firing; `pg_cron` job not running; `pg_net` queue stuck; `42501 ... http_request_queue` | Database jobs | `postgres_logs` |
| Read/query logs; interpret Postgres logs; read metrics | Diagnostics | any `source` — see [logs-and-evidence.md](logs-and-evidence.md) |

For query performance and schema-design optimization (indexes, `EXPLAIN`, N+1, partitioning), use the **supabase-postgres-best-practices** skill: this workflow covers *diagnosing* the failure, that skill covers *optimizing* the design.

## Verify before declaring done

Debugging is complete only when you have re-run the failing operation, it succeeds, and the layer's log shows the clean result. State what you changed, why the evidence pointed there, and how you confirmed the fix.
