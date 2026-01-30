---
title: Realtime Requires Primary Keys
impact: MEDIUM-HIGH
impactDescription: Prevents Realtime subscription failures and data sync issues
tags: realtime, primary-keys, subscriptions
---

## Realtime Requires Primary Keys

Supabase Realtime uses primary keys to track row changes. Tables without primary
keys cannot be subscribed to.

**Incorrect:**

```sql
-- No primary key - Realtime subscriptions will fail
create table messages (
  user_id uuid,
  content text,
  created_at timestamptz default now()
);
```

**Correct:**

```sql
create table messages (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
```

## Enable Realtime for a Table

**Via SQL:**

```sql
-- Add table to realtime publication
alter publication supabase_realtime add table messages;
```

**Via Dashboard:**

Database > Publications > supabase_realtime > Add table

## Realtime with RLS

RLS policies apply to Realtime subscriptions. Users only receive changes they
have access to.

```sql
-- Policy applies to realtime
create policy "Users see own messages" on messages
  for select to authenticated
  using (user_id = (select auth.uid()));
```

```javascript
// Subscribe with RLS filtering
const channel = supabase
  .channel("messages")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "messages" },
    (payload) => console.log(payload)
  )
  .subscribe();
```

## Performance Considerations

- Add indexes on columns used in Realtime filters
- Keep RLS policies simple for subscribed tables
- Monitor "Realtime Private Channel RLS Execution Time" in Dashboard

## Replica Identity

By default, only the primary key is sent in UPDATE/DELETE payloads. To receive
all columns:

```sql
-- Send all columns in change events (increases bandwidth)
alter table messages replica identity full;
```

## Related

- [rls-mandatory.md](rls-mandatory.md)
- [Docs](https://supabase.com/docs/guides/realtime)
