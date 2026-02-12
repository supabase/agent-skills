---
title: Create and Configure Realtime Channels
impact: HIGH
impactDescription: Proper channel setup enables reliable real-time communication
tags: realtime, channels, configuration, topics, naming
---

## Create and Configure Realtime Channels

Channels are rooms where clients communicate. Use consistent naming and appropriate configuration.

## Topic Naming Convention

Use `scope:id:entity` format for predictable, filterable topics.

**Incorrect:**

```javascript
// Generic names make filtering impossible
const channel = supabase.channel('messages')
const channel = supabase.channel('room1')
```

**Correct:**

```javascript
// Structured naming enables topic-based RLS policies
const channel = supabase.channel('room:123:messages')
const channel = supabase.channel('user:456:notifications')
const channel = supabase.channel('game:789:moves')
```

## Channel Configuration Options

```javascript
const channel = supabase.channel('room:123:messages', {
  config: {
    private: true,              // Require authentication (requires RLS on realtime.messages)
    broadcast: {
      self: true,               // Receive own messages
      ack: true,                // Get server acknowledgment
    },
    presence: {
      key: 'user-session-id',   // Custom presence key (default: UUIDv1)
    },
  },
})
```

## Event Naming

Use snake_case for event names.

**Incorrect:**

```javascript
channel.send({ type: 'broadcast', event: 'newMessage', payload: {} })
```

**Correct:**

```javascript
channel.send({ type: 'broadcast', event: 'message_created', payload: {} })
channel.send({ type: 'broadcast', event: 'user_joined', payload: {} })
```

## Related

- [setup-auth.md](setup-auth.md)
- [Docs](https://supabase.com/docs/guides/realtime/concepts)
