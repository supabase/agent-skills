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
// Wrong SSE format - missing "data:" prefix and double newline
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(encoder.encode(JSON.stringify({ test: true })));
  },
});
```

**Correct:**

```typescript
// Server: SSE stream
Deno.serve(async (req) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 1; i <= 5; i++) {
        // SSE format: "data:" prefix + double newline
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: i })}\n\n`));
        await new Promise((r) => setTimeout(r, 1000));
      }
      controller.close();
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
