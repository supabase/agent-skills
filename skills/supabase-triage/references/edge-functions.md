# Edge Functions Triage

Each isolate limit for reference: **2s CPU**, **250MB memory**, **400s wall clock**, **150s max response-initiation time**. At 50% resource usage an isolate finishes the current request then shuts down; exceeding 100% before completion kills it immediately.

## 546 — resource limit exceeded
**Symptom:** `{"code":"WORKER_RESOURCE_LIMIT","message":"Function failed due to not having enough compute resources"}`.
**Cause:** The isolate exceeded its CPU (2s) or memory (250MB) budget mid-request.
**Fix:** Check the function's Logs tab for "Memory limit exceeded" / "CPU Time exceeded", or query `function_logs`/`function_edge_logs` joined on `execution_id`. Reduce work per invocation (stream, batch, or split into smaller functions).
Source: https://github.com/orgs/supabase/discussions/42537

## Shutdown reasons explained
**Symptom:** Need to interpret a function's `ShutdownEvent` reason.
**Reasons:** `EventLoopCompleted` — normal graceful finish, nothing to do. `WallClockTime` — exceeded the 400s total wall-clock budget (includes I/O wait) — break work into smaller functions, stream responses, or offload to a background job/queue. (Also see `EarlyDrop`, covered under WebSocket drops below.)
Source: https://github.com/orgs/supabase/discussions/40097

## 401 error response
**Symptom:** Function call returns 401.
**Triage:** Body says `"Invalid Token or Protected Header formatting"` or `"Missing authorization header"` → the platform's built-in legacy JWT check rejected the request before your code ran (bad/missing `Authorization` header, or incompatible key format). Body has a custom message or is empty → your function code executed and returned the 401 itself. If unsure, classify recent 401s in Log Explorer by joining `function_edge_logs` metadata on execution_id/auth fields (see full article for the query) — distinguishes `your_code_returned_401` / `incompatible_keys` / `invalid_key` / `missing_auth_header`.
Source: https://github.com/orgs/supabase/discussions/47243

## 404 error response
**Symptom:** `{"code":"NOT_FOUND","message":"Requested function was not found"}`.
**Cause:** The function name in the URL (`/functions/v1/<name>`) isn't recognized by the runtime — not deployed, or a typo.
**Fix:** Check for miscapitalization, em-dash vs. hyphen, stray slashes. Confirm via a test call from the Function Dashboard. Query `function_edge_logs` for `status_code = 404` and check whether `metadata.execution_id` is null (`FUNCTION_NOT_FOUND`, platform-level) vs. present (your code returned a custom 404).
Source: https://github.com/orgs/supabase/discussions/43645

## 500 error response
**Symptom:** Function returns 500.
**Triage:** Body is exactly `"Internal Server Error"` → unhandled JS exception (uncaught throw/rejection) — go find the stack trace in logs. Body has a custom message or is empty → run the Log Explorer query joining `function_logs`/`function_edge_logs` on `execution_id` filtered to `status_code = 500` — no results means your code returned the 500 deliberately (check your `return new Response(...)` calls); results mean a real JS failure, inspect the `event_message` for the stack trace.
Source: https://github.com/orgs/supabase/discussions/47410

## 504 error response
**Symptom:** Function times out at 504.
**Cause:** Failed to initiate a response within the hard 150s limit (not currently configurable).
**Fix:** Find slow invocations: filter `function_edge_logs` for `status_code = 504`, and average `execution_time_ms` grouped by `pathname` to find consistently slow functions. Instrument with `console.time`/`console.timeEnd` around suspect sections. If the work genuinely needs >150s, move it to a background job/queue instead of a synchronous Edge Function call.
Source: https://github.com/orgs/supabase/discussions/47050

## 'Wall clock time limit reached'
**Symptom:** Shutdown log says wall clock time limit reached.
**Cause:** Total elapsed time (including I/O wait) hit 400s, OR CPU active-compute time hit 200ms — either can trigger this message. Note: this message is sometimes logged even when the worker wasn't actually the offending resource, so only treat it as the root cause when paired with a **546** response (indicates the function really was terminated for exceeding limits, i.e. a genuinely long-running task).
**Fix:** Review function logic for inefficiencies/long-running operations; split into smaller units or move to background processing.
Source: https://github.com/orgs/supabase/discussions/21293

## Rate limit exceeded for trace
**Symptom:** `RateLimitError: "Rate limit exceeded for trace ..."`.
**Cause:** Fan-out pattern — a parent execution (e.g. a cron job) calls `supabase.functions.invoke()` many times in a loop. All those downstream calls share one Trace ID and draw from a *per-trace* rate budget (smaller than total project capacity), which gets exhausted under high fan-out volume.
**Fix:** Pace invocations with a delay between calls; batch payloads so one invocation processes many records instead of one-per-record; or consolidate the downstream logic into a shared library/inline code to avoid the cross-function calls entirely.
Source: https://github.com/orgs/supabase/discussions/45875

## Worker timeouts and WebSocket drops
**Symptom:** A WebSocket connection consistently drops around half the wall-clock limit, with `EarlyDrop` in the logs.
**Cause:** After `Deno.upgradeWebSocket(req)` returns, the HTTP request is considered "acknowledged." If there's no unresolved `EdgeRuntime.waitUntil()` promise, the isolate looks idle and can be retired early even with an open socket.
**Fix:** Keep a pending `waitUntil()` promise tied to the socket's lifecycle:
```ts
const socketClosedPromise = new Promise<void>((resolve) => { socket.onclose = () => resolve() })
EdgeRuntime.waitUntil(socketClosedPromise)
```
Note this prevents early retirement but does **not** extend the hard wall-clock limit itself.
Source: https://github.com/orgs/supabase/discussions/46506

## Inspecting Edge Function environment variables
**Symptom:** Need to verify a secret/env var is actually set and being read correctly.
**Fix:** `npx supabase secrets set --env-file ./supabase/.env --project-ref <ref>` to deploy, `npx supabase secrets list` to confirm. Log a truncated value (never the full secret): `console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL').slice(0, 15))`. Search filters in the log explorer are case-sensitive; very long JSON logs get truncated — `JSON.stringify()` first if you need to inspect the full payload elsewhere.
Source: https://github.com/orgs/supabase/discussions/27139
