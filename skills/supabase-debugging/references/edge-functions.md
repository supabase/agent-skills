# Edge Functions

Edge Functions run as Deno **isolates** with hard limits. Two log sources tell the story: **`function_edge_logs`** (the HTTP request in front of the function — status, timing) and **`function_logs`** (`console` output and runtime events *inside* the function). For any failure, read both.

The first fork for every error: **did your code return this status, or did the platform?** `function_logs` with an `execution_id` and your own message = your code. A platform message (`BOOT_ERROR`, `WORKER_LIMIT`, `NOT_FOUND`) with no `execution_id` = the platform.

## Status-code map

| Status | Meaning | Check first |
| --- | --- | --- |
| **401** | JWT verification failed, or your code returned 401 | Is the built-in JWT check on? Is the `Authorization` header present and a valid key? |
| **404** | Runtime doesn't recognize the function name (browsers may mislabel this as CORS) | Typo/casing in the URL; is it deployed? Test from the dashboard |
| **500** | Unhandled JS exception, or your code returned 500 | `function_logs` for the stack trace; search code for `status: 500` |
| **503** | `BOOT_ERROR` — the function failed to start (syntax/import) — or your code returned 503 | `function_logs` for `BootFailure` / "worker boot error" |
| **504** | No response within **150s** (hard gateway idle limit) | `execution_time_ms`; parallelize/await-audit |
| **546** | Resource limit exceeded — CPU time, memory, or wall-clock | `function_logs` `Shutdown` reason (`CPUTime`/`Memory`/`WallClockTime`); read the current ceilings off the Edge Functions limits page |

## By symptom

### 401 — Invalid JWT / missing authorization
**Cause:** The built-in JWT check rejected the request, the key is invalid/incompatible, or your own code returned 401.
**Fix:** Send `Authorization: Bearer <anon-or-service-key>`. If the function is meant to be public (webhooks, OAuth callbacks), disable the check: deploy with `--no-verify-jwt`, or toggle **Verify JWT** off in the dashboard, or `verify_jwt: false` in `config.toml`. If your code raised it, trace the `status: 401` branch.

### 404 — function not found
**Fix:** Check the name for typos/casing/stray slashes; invoke it from the dashboard test panel; redeploy (`supabase functions deploy <name>`). Note browsers report this as a CORS error — trust the logs, not the browser.

### 500 — internal error
**Cause:** Unhandled `TypeError`/`ReferenceError`/etc., or an explicit `status: 500`.
**Fix:** Read the stack trace in `function_logs`; wrap risky code in `try/catch` with `console.error`; validate external API responses before use.

### 503 — `BOOT_ERROR` (function won't start)
**Cause:** The module failed to compile/import — redeclared `const`, top-level `await` in a non-async context, or a bad/nonexistent import.
**Fix:** `function_logs` `BootFailure` shows the offending line. Run `deno check ./supabase/functions/<name>/index.ts` locally to catch it before deploy.

### 504 — 150s timeout
**Fix:** Parallelize independent awaits with `Promise.all`; move long work to a **Background Task** (`EdgeRuntime.waitUntil(...)`); cache; trim the payload. The 150s limit is hard and can't be raised.

### 546 — CPU / memory / wall-clock limit
**Diagnose:** `function_logs` `Shutdown` event carries the `reason` plus `cpu_time_used` / `memory_used`. The exact CPU and memory ceilings change over time (and differ between older docs) — read them off the current Edge Functions limits page rather than assuming a number.
**Fix:** By reason — **Memory:** stream instead of buffering, process in chunks; **CPUTime:** optimize hot loops, offload heavy compute to a Postgres function or a background task; **WallClockTime:** reduce I/O waits, split into smaller functions. If the workload genuinely needs more than the isolate allows, it doesn't belong in an Edge Function.

### WebSocket / SSE stream drops at a fixed interval
**Cause:** The isolate looks idle after the response and is dropped, or it hit the wall-clock limit.
**Fix:** Keep the isolate alive for the stream's lifetime:
```ts
EdgeRuntime.waitUntil(upstream.body.pipeTo(writable))   // or a promise that resolves when the socket closes
```

### Called from a browser: CORS error / preflight (`OPTIONS`) fails
**Cause:** Edge Functions don't add CORS headers for you, so the browser's preflight `OPTIONS` gets no `Access-Control-Allow-*` and the real request never fires. (A 404 also surfaces as a CORS error in the browser — rule that out first.)
**Fix:** Handle `OPTIONS` and echo CORS headers on every response:
```ts
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  return new Response(JSON.stringify(result), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
```
The Data API (PostgREST) returns CORS headers automatically — this is an Edge Function concern only.

## Deploy & bundle

### `Function deploy failed due to an internal error` / won't deploy
**Cause:** Syntax/import error, or the bundle exceeds the size limit.
**Fix:** Deploy with `--debug` to see the real cause and the reported script size; run `deno check` first; if size is the issue, try `--use-api` or `--use-docker` bundling and slim dependencies (below).

### Bundle too large / slow cold starts
**Fix:** Use selective imports (`import { X } from 'npm:pkg/x'`, not the whole package), pick lightweight libs (`date-fns` over `moment`), and profile with `deno info ./supabase/functions/<name>/index.ts`. Lazy-init heavy clients so they don't run at boot.

### `esm.sh` import throws (e.g. Stripe)
**Fix:** Add the Deno target: `import Stripe from 'https://esm.sh/stripe@11.2.0?target=deno'`.

### `Rate limit exceeded for trace`
**Cause:** One invocation fanned out into too many downstream calls.
**Fix:** Batch the work per invocation and pace calls (small delays) instead of firing them all at once.

## Local dev & secrets

### `supabase functions serve` fails locally
**Fix:** Free ports `54321`/`8081` (stop other Supabase/Docker instances), clear the Deno cache (`deno cache --reload`), and confirm the `.env` file is present. Add `--debug` for detail.

### Verify a secret is set
`supabase secrets list`; set with `supabase secrets set --env-file ./supabase/.env`; from inside the function, log `Deno.env.get('NAME')` (truncated) and read it in `function_logs`.
