---
title: Background Tasks
impact: MEDIUM-HIGH
impactDescription: Enables fast responses for long-running operations
tags: edge-functions, background, waituntil, async
---

## Background Tasks

Execute long-running operations without blocking responses using `EdgeRuntime.waitUntil()`. Return immediately while processing continues in background. Background tasks still count against wall clock, CPU, and memory limits.

**Incorrect:**

```typescript
// Awaiting waitUntil defeats the purpose
Deno.serve(async (req) => {
  await EdgeRuntime.waitUntil(sendEmail()); // Blocks response!
  return Response.json({ done: true });
});

// No error handling in background task
EdgeRuntime.waitUntil(riskyOperation()); // Errors silently lost
```

**Correct:**

```typescript
Deno.serve(async (req) => {
  const { email, message } = await req.json();

  // Start background task without await
  EdgeRuntime.waitUntil(
    sendEmail(email, message).catch((error) => {
      console.error("Background task failed:", error);
    })
  );

  // Return immediately
  return Response.json({ status: "Email queued" });
});

// Handle shutdown for long-running tasks
addEventListener("beforeunload", (event) => {
  console.log("Shutting down:", event.detail?.reason);
});
```

For local development, set `[edge_runtime] policy = "per_worker"` in config.toml (disables hot reload).

Reference: [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks)
