---
title: WebSocket Handling
impact: MEDIUM
impactDescription: Enables bidirectional real-time communication
tags: edge-functions, websockets, realtime, bidirectional
---

## WebSocket Handling

Create WebSocket servers for bidirectional communication. Browser clients cannot send custom headers, so pass JWT via query parameters. Deploy with `--no-verify-jwt`.

**Incorrect:**

```typescript
// Browser WebSocket cannot send custom headers
const ws = new WebSocket(url, {
  headers: { Authorization: `Bearer ${token}` }, // Won't work!
});

// Sending without checking socket state
socket.send(data); // May throw if socket closed

// Deployed with JWT verification enabled
npx supabase functions deploy websocket // Gateway blocks WebSocket upgrade
```

**Correct:**

```typescript
// Server: WebSocket with query param auth
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) return new Response("Missing token", { status: 401 });

  // Verify JWT
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return new Response("Invalid token", { status: 401 });

  // Verify this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onmessage = (e) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(`Echo: ${e.data}`);
    }
  };

  return response;
});

// Client: pass token via query param
const ws = new WebSocket(`wss://PROJECT.supabase.co/functions/v1/ws?token=${token}`);
```

Deploy: `npx supabase functions deploy websocket --no-verify-jwt`

Reference: [WebSockets Guide](https://supabase.com/docs/guides/functions/websockets)
