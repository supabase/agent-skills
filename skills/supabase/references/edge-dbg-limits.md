---
title: Limits and Troubleshooting
impact: HIGH
impactDescription: Prevents production failures and debugging bottlenecks
tags: edge-functions, limits, debugging, troubleshooting
---

## Limits and Troubleshooting

Understand Edge Function limits: 256MB memory, 2s CPU time, 150s (free) or 400s (paid) wall clock, and 150s request idle timeout (triggers 504 if no response sent). Check logs for debugging.

**Incorrect:**

```typescript
// Loading entire large dataset into memory
const allData = await supabase.from("huge_table").select("*"); // Memory exceeded

// CPU-intensive without batching
for (let i = 0; i < 1000000; i++) {
  heavyComputation(i); // CPU time exceeded
}

// Await without timeout
const data = await fetch(externalApi); // May hang forever -> 504 timeout
```

**Correct:**

```typescript
// Paginate large queries
const { data } = await supabase
  .from("huge_table")
  .select("*")
  .range(0, 100); // Fetch in batches

// Add timeout to external calls
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

const response = await fetch(externalApi, { signal: controller.signal });
clearTimeout(timeout);

// Use background tasks for long operations
EdgeRuntime.waitUntil(processInBatches(items, 100));
return Response.json({ status: "processing" });
```

Debug with: `npx supabase functions serve --inspect-mode brk` (or shorthand `--inspect`). Check `SB_REGION` and `SB_EXECUTION_ID` env vars for tracing (hosted environment only).

Common errors: 504 (timeout), 503 (boot error — syntax/import), 500 (uncaught exception), 401 (invalid JWT), 546 (resource limit — memory/CPU exceeded).

Reference: [Limits](https://supabase.com/docs/guides/functions/limits)
