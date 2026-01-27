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
| `too_many_connections` | Connection limit exceeded | Clean up unused channels, upgrade plan |
| `too_many_joins` | Channel join rate exceeded | Reduce join frequency |
| `ConnectionRateLimitReached` | Max connections reached | Upgrade plan |
| `DatabaseLackOfConnections` | No available DB connections | Increase compute size |
| `TenantNotFound` | Invalid project reference | Verify project URL |

## Automatic Reconnection

Supabase handles reconnection with exponential backoff. Configure timing:

```javascript
const supabase = createClient(url, key, {
  realtime: {
    params: {
      log_level: 'info',  // 'debug' | 'info' | 'warn' | 'error'
    },
  },
})
```

## Silent Disconnections in Background

WebSocket connections can disconnect when apps are backgrounded (mobile, inactive tabs).

**Solution:** Monitor connection state and re-subscribe when needed:

```javascript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    // Re-track presence if needed
    channel.track({ user_id: userId, online_at: new Date().toISOString() })
  }
})
```

## Authorization Errors

Private channel authorization fails when:
- User not authenticated (`setAuth()` not called)
- Missing RLS policies on `realtime.messages`
- Token expired (refresh before expiry)

```javascript
// Refresh auth before token expires
await supabase.realtime.setAuth('fresh-jwt-token')
```

## Related

- [patterns-cleanup.md](patterns-cleanup.md)
- [setup-auth.md](setup-auth.md)
- [Docs](https://supabase.com/docs/guides/realtime/troubleshooting)
