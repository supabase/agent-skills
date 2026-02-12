---
title: Debug Realtime Connections
impact: MEDIUM
impactDescription: Enables visibility into connection and message flow issues
tags: realtime, debugging, logging, troubleshooting
---

## Debug Realtime Connections

Use logging to diagnose connection issues, message flow, and performance problems.

## Client-Side Logging

**Incorrect:**

```javascript
// No logging - no visibility into issues
const supabase = createClient(url, key)
```

**Correct:**

Enable client-side logging with a custom logger function:

```javascript
const supabase = createClient(url, key, {
  realtime: {
    logger: (kind, msg, data) => {
      console.log(`[${kind}] ${msg}`, data)
    },
  },
})
```

Log message types:
- `push` - Messages sent to server
- `receive` - Messages received from server
- `transport` - Connection events (connect, disconnect, heartbeat)
- `error` - Error events
- `worker` - Web Worker events

## Server-Side Log Level

Configure Realtime server log verbosity:

```javascript
const supabase = createClient(url, key, {
  realtime: {
    logLevel: 'info',  // 'info' | 'warn' | 'error'
  },
})
```

This affects the verbosity of logs from the Realtime server, not client-side logs.

## Filtering Logs for Debugging

Filter logs to focus on specific events:

```javascript
const supabase = createClient(url, key, {
  realtime: {
    logger: (kind, msg, data) => {
      // Only log push/receive for subscription debugging
      if (kind === 'push' || kind === 'receive') {
        console.log(`[${kind}] ${msg}`, data)
      }
    },
  },
})
```

## Related

- [patterns-errors.md](patterns-errors.md)
- [Docs](https://supabase.com/docs/guides/troubleshooting/realtime-debugging-with-logger)
