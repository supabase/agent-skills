---
title: Streaming Responses
impact: MEDIUM
impactDescription: Enables real-time data delivery and AI response streaming
tags: edge-functions, streaming, sse, server-sent-events
---

## Streaming Responses

Stream data progressively to clients using ReadableStream or Server-Sent Events.

**Incorrect:**

```typescript
// Missing error handling in stream callback
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(encoder.encode(JSON.stringify({ test: true })));
    // No try/catch/finally — errors silently lost, stream never closed
  },
});
```

**Correct:**

```typescript
// SSE stream with proper error handling
Deno.serve(async (req) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 1; i <= 5; i++) {
          // SSE format: "data:" prefix + double newline
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: i })}\n\n`));
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
```

Both SSE-formatted streaming (with `data:` prefix) and raw streaming (without prefix) are valid. Use SSE format when consumed by `EventSource`; use raw streaming for AI model responses or binary data.
