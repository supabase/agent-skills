---
title: Handle Realtime Errors and Connection Issues
impact: HIGH
impactDescription: Enables graceful handling of connection failures
tags: realtime, errors, subscribe, status, reconnection
---

## Handle Realtime Errors and Connection Issues

Handle subscription status and errors to provide reliable user experiences.

## Subscription Status Handling

**Incorrect:**

```javascript
// Ignoring subscription status - no visibility into connection issues
channel.subscribe()
```

**Correct:**

```javascript
channel.subscribe((status, err) => {
  switch (status) {
    case 'SUBSCRIBED':
      console.log('Connected!')
      break
    case 'CHANNEL_ERROR':
      console.error('Channel error:', err)
      // Client retries automatically
      break
    case 'TIMED_OUT':
      console.error('Connection timed out')
      break
    case 'CLOSED':
      console.log('Channel closed')
      break
  }
})
```

## Common Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `ConnectionRateLimitReached` | Connection limit exceeded | Clean up unused channels, upgrade plan |
| `ChannelRateLimitReached` | Too many channels per connection | Remove unused channels (limit: 100/connection) |
| `ClientJoinRateLimitReached` | Channel join rate exceeded | Reduce join frequency |
| `TenantNotFound` | Invalid project reference | Verify project URL |

## Automatic Reconnection

Supabase handles reconnection automatically with exponential backoff (1s, 2s, 5s, 10s). No manual re-subscribe is needed for standard disconnects. For silent disconnections in backgrounded apps, use `heartbeatCallback` to detect and trigger reconnection (see below).

## Client-Side Logging

Enable client-side logging to debug connection issues:

```javascript
const supabase = createClient(url, key, {
  realtime: {
    logger: (kind, msg, data) => {
      console.log(`[${kind}] ${msg}`, data)
    },
  },
})
```

Log message types include `push`, `receive`, `transport`, `error`, and `worker`.

## Silent Disconnections in Background

WebSocket connections can disconnect when apps are backgrounded (mobile, inactive
tabs) due to browser throttling of timers. Two solutions:

```javascript
const supabase = createClient(url, key, {
  realtime: {
    // 1. Use Web Worker to prevent browser throttling of heartbeats
    worker: true,
    // 2. Detect disconnections and reconnect
    heartbeatCallback: (status) => {
      if (status === 'disconnected') {
        supabase.realtime.connect()
      }
    },
  },
})
```

Use both together: `worker` prevents throttling, `heartbeatCallback` handles
network-level disconnections. Re-track presence after reconnection if needed:

```javascript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    channel.track({ user_id: userId, online_at: new Date().toISOString() })
  }
})
```

## Authorization Errors

Private channel authorization fails when:
- User not authenticated
- Missing RLS policies on `realtime.messages`
- Token expired

## Related

- [patterns-cleanup.md](patterns-cleanup.md)
- [setup-auth.md](setup-auth.md)
- [Docs](https://supabase.com/docs/guides/realtime/limits)
