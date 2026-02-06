---
title: Track User Presence and Online Status
impact: MEDIUM
impactDescription: Enables features like online indicators and typing status
tags: realtime, presence, track, online, state
---

## Track User Presence and Online Status

Presence synchronizes shared state between users. Use sparingly due to computational overhead.

## Track Presence

```javascript
const channel = supabase.channel('room:123', {
  config: { private: true },
})

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', Object.keys(state))
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key, newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key, leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: 'user-123',
        online_at: new Date().toISOString(),
      })
    }
  })
```

## Get Current State

```javascript
const state = channel.presenceState()
// Returns: { "key1": [{ user_id: "123" }], "key2": [{ user_id: "456" }] }
```

## Stop Tracking

```javascript
await channel.untrack()
```

## Custom Presence Key

By default, presence uses a UUIDv1 key. Override for user-specific tracking.

**Incorrect:**

```javascript
// Each browser tab gets separate presence entry
const channel = supabase.channel('room:123')
```

**Correct:**

```javascript
// Same user shows once across tabs
const channel = supabase.channel('room:123', {
  config: {
    presence: { key: `user:${userId}` },
  },
})
```

## Quotas

| Plan | Presence Messages/Second |
|------|-------------------------|
| Free | 20 |
| Pro | 50 |
| Team/Enterprise | 1,000 |
For Pay as you go customers you can edit these limits on [Realtime Settings](https://supabase.com/dashboard/project/_/realtime/settings)
## Related

- [setup-channels.md](setup-channels.md)
- [patterns-cleanup.md](patterns-cleanup.md)
- [Docs](https://supabase.com/docs/guides/realtime/presence)
