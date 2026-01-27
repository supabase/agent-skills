---
title: Clean Up Channels to Prevent Memory Leaks
impact: CRITICAL
impactDescription: Prevents memory leaks and connection quota exhaustion
tags: realtime, cleanup, react, lifecycle, removeChannel
---

## Clean Up Channels to Prevent Memory Leaks

Always remove channels when components unmount or subscriptions are no longer needed.

## React Pattern

**Incorrect:**

```javascript
function ChatRoom({ roomId }) {
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)
    channel.on('broadcast', { event: 'message' }, handleMessage).subscribe()
    // Missing cleanup - channel persists after unmount
  }, [roomId])
}
```

**Correct:**

```javascript
function ChatRoom({ roomId }) {
  const channelRef = useRef(null)

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current?.state === 'subscribed') return

    const channel = supabase.channel(`room:${roomId}:messages`, {
      config: { private: true },
    })
    channelRef.current = channel

    supabase.realtime.setAuth()

    channel
      .on('broadcast', { event: 'message_created' }, handleMessage)
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [roomId])
}
```

## Channel Lifecycle Methods

```javascript
// Remove specific channel
supabase.removeChannel(channel)

// Remove all channels (e.g., on logout)
supabase.removeAllChannels()

// Get active channels
const channels = supabase.getChannels()
```

## Check Channel State Before Subscribing

```javascript
// Prevent duplicate subscriptions
if (channel.state === 'subscribed') {
  return
}
channel.subscribe()
```

## Connection Quotas

| Plan | Max Connections | Channels per Connection |
|------|-----------------|------------------------|
| Free | 200 | 100 |
| Pro | 500 | 100 |
| Team | 10,000 | 100 |

Leaked channels count against quotas even when inactive.

## Related

- [patterns-errors.md](patterns-errors.md)
- [setup-channels.md](setup-channels.md)
- [Docs](https://supabase.com/docs/guides/realtime/quotas)
