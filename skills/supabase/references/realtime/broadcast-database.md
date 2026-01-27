---
title: Broadcast from Database Triggers
impact: CRITICAL
impactDescription: Scalable pattern for notifying clients of database changes
tags: realtime, broadcast, database, triggers, realtime.send, realtime.broadcast_changes
---

## Broadcast from Database Triggers

Use database triggers with `realtime.broadcast_changes()` instead of `postgres_changes` for better scalability. This avoids per-subscriber RLS checks.

## realtime.broadcast_changes()

Broadcasts database changes in a standard format.

```sql
create or replace function room_messages_broadcast()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'room:' || coalesce(new.room_id, old.room_id)::text,  -- topic
    tg_op,                                                 -- event (INSERT/UPDATE/DELETE)
    tg_op,                                                 -- operation
    tg_table_name,                                         -- table
    tg_table_schema,                                       -- schema
    new,                                                   -- new record
    old                                                    -- old record
  );
  return coalesce(new, old);
end;
$$;

create trigger messages_broadcast_trigger
  after insert or update or delete on messages
  for each row execute function room_messages_broadcast();
```

**Client subscription:**

```javascript
await supabase.realtime.setAuth()
const channel = supabase
  .channel('room:123', { config: { private: true } })
  .on('broadcast', { event: 'INSERT' }, (payload) => console.log('Insert:', payload))
  .on('broadcast', { event: 'UPDATE' }, (payload) => console.log('Update:', payload))
  .on('broadcast', { event: 'DELETE' }, (payload) => console.log('Delete:', payload))
  .subscribe()
```

## realtime.send()

Sends custom payloads without table binding.

```sql
select realtime.send(
  jsonb_build_object('message', 'Custom notification'),  -- payload
  'notification_sent',                                   -- event
  'user:456:notifications',                              -- topic
  true                                                   -- private (true = requires auth)
);
```

## Public vs Private Mismatch

**Incorrect:**

```sql
-- Database sends to public channel
select realtime.send('{}', 'event', 'topic', false);  -- private = false
```

```javascript
// Client expects private channel - won't receive message
const channel = supabase.channel('topic', { config: { private: true } })
```

**Correct:**

```sql
-- Database sends to private channel
select realtime.send('{}', 'event', 'topic', true);  -- private = true
```

```javascript
// Client matches
const channel = supabase.channel('topic', { config: { private: true } })
```

## Related

- [setup-auth.md](setup-auth.md)
- [broadcast-basics.md](broadcast-basics.md)
- [Docs](https://supabase.com/docs/guides/realtime/broadcast)
