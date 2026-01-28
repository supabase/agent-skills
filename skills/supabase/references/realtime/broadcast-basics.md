---
title: Send and Receive Broadcast Messages
impact: HIGH
impactDescription: Core pattern for real-time client-to-client messaging
tags: realtime, broadcast, send, receive, subscribe
---

## Send and Receive Broadcast Messages

Broadcast enables low-latency pub/sub messaging between clients. Prefer Broadcast over Postgres Changes for applications that require more concurrent connections.

## Subscribe to Broadcast Events

```javascript
const channel = supabase.channel('room:123:messages', {
  config: { private: true },
})

channel
  .on('broadcast', { event: 'message_created' }, (payload) => {
    console.log('New message:', payload.payload)
  })
  .on('broadcast', { event: '*' }, (payload) => {
    // Listen to all events on this channel
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected!')
    }
  })
```

## Send Messages

**After subscribing (WebSocket - lower latency):**

```javascript
channel.send({
  type: 'broadcast',
  event: 'message_created',
  payload: { text: 'Hello!', user_id: '123' },
})
```

**Before subscribing or one-off (HTTP):**

```javascript
await channel.httpSend('message_created', { text: 'Hello!' })
```

## Receive Own Messages

By default, senders don't receive their own broadcasts.

**Incorrect:**

```javascript
// Won't receive own messages
const channel = supabase.channel('room:123')
```

**Correct:**

```javascript
// Enable self-receive when needed (e.g., optimistic UI confirmation)
const channel = supabase.channel('room:123', {
  config: {
    broadcast: { self: true },
  },
})
```

## Get Server Acknowledgment

```javascript
const channel = supabase.channel('room:123', {
  config: {
    broadcast: { ack: true },
  },
})

// Returns 'ok' when server confirms receipt
const status = await channel.send({
  type: 'broadcast',
  event: 'message_created',
  payload: { text: 'Hello!' },
})
```

## Related

- [broadcast-database.md](broadcast-database.md)
- [patterns-cleanup.md](patterns-cleanup.md)
- [Docs](https://supabase.com/docs/guides/realtime/broadcast)
