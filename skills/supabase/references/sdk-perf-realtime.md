---
title: Realtime Performance and Cleanup
impact: HIGH
impactDescription: Prevents memory leaks and ensures reliable subscriptions
tags: realtime, subscriptions, cleanup, channels, broadcast, postgres-changes
---

## Realtime Performance and Cleanup

Realtime subscriptions require proper cleanup to prevent memory leaks.

## Basic Subscription

```typescript
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log('New message:', payload.new)
  )
  .subscribe()
```

## React Cleanup Pattern (Critical)

**Incorrect:**

```typescript
// Memory leak - subscription never cleaned up
useEffect(() => {
  const supabase = createClient()
  supabase
    .channel('messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handler)
    .subscribe()
}, [])
```

**Correct:**

```typescript
useEffect(() => {
  const supabase = createClient()
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handler)
    .subscribe()

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Filter Subscriptions

Reduce server load by filtering at the source:

```typescript
const channel = supabase
  .channel('user-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`,
    },
    handleMessage
  )
  .subscribe()
```

## Connection Status Handling

```typescript
const channel = supabase.channel('my-channel')

channel.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected')
  } else if (status === 'CHANNEL_ERROR') {
    console.error('Connection error:', err)
  } else if (status === 'TIMED_OUT') {
    console.log('Connection timed out, retrying...')
  } else if (status === 'CLOSED') {
    console.log('Connection closed')
  }
})
```

## Use Broadcast for Scale

Postgres Changes don't scale horizontally. For high-throughput use cases, use Broadcast:

```typescript
// In a database trigger, broadcast changes
// create trigger notify_changes after insert on messages
// for each row execute function realtime.broadcast_changes('messages', 'INSERT', ...);

// Client subscribes to broadcast
const channel = supabase
  .channel('messages-broadcast')
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    console.log('New message:', payload)
  })
  .subscribe()
```

## Limitations

| Limitation | Description |
|------------|-------------|
| Single thread | Postgres Changes processed on one thread |
| DELETE filters | Cannot filter DELETE events by column |
| RLS per subscriber | 100 subscribers = 100 RLS checks per change |
| Table names | Cannot contain spaces |

## Multiple Tables

```typescript
const channel = supabase
  .channel('db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handleMessages)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, handleNewUser)
  .subscribe()
```

## Related

- [perf-queries.md](perf-queries.md)
- [error-handling.md](error-handling.md)
