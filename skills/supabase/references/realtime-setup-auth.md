---
title: Configure Private Channels with Authentication
impact: CRITICAL
impactDescription: Prevents unauthorized access to real-time messages
tags: realtime, auth, private, rls, security, setAuth
---

## Configure Private Channels with Authentication

Always use private channels in production. Public channels allow any client to subscribe.

## Enable Private Channels

**Incorrect:**

```javascript
// Public channel - anyone can subscribe
const channel = supabase.channel('room:123:messages')
```

**Correct:**

```javascript
// Private channel requires authentication
const channel = supabase.channel('room:123:messages', {
  config: { private: true },
})
```

## RLS Policies on realtime.messages

Private channels require RLS policies on the `realtime.messages` table.

**Read access (subscribe to channel):**

```sql
create policy "authenticated_users_can_receive"
on realtime.messages for select
to authenticated
using (true);
```

**Write access (send to channel):**

```sql
create policy "authenticated_users_can_send"
on realtime.messages for insert
to authenticated
with check (true);
```

**Topic-specific access:**

```sql
-- Only room members can receive messages
create policy "room_members_can_read"
on realtime.messages for select
to authenticated
using (
  extension in ('broadcast', 'presence')
  and exists (
    select 1 from room_members
    where user_id = (select auth.uid())
    and room_id = split_part(realtime.topic(), ':', 2)::uuid
  )
);
```

## Index RLS Policy Columns

Missing indexes slow channel joins significantly.

```sql
create index idx_room_members_user_room
on room_members(user_id, room_id);
```

## Related

- [setup-channels.md](setup-channels.md)
- [broadcast-database.md](broadcast-database.md)
- [Docs](https://supabase.com/docs/guides/realtime/authorization)
