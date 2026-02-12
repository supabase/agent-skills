---
title: Listen to Database Changes with Postgres Changes
impact: MEDIUM
impactDescription: Simple database change listeners with scaling limitations
tags: realtime, postgres_changes, database, subscribe, publication
---

## Listen to Database Changes with Postgres Changes

Postgres Changes streams database changes via logical replication. Note: **Broadcast is recommended for applications that demand higher scalability**.

## When to Use Postgres Changes

- Quick prototyping and development
- Low user counts (< 100 concurrent subscribers per table)
- When simplicity is more important than scale

## Basic Setup

**1. Add table to publication:**

```sql
alter publication supabase_realtime add table messages;
```

**2. Subscribe to changes:**

```javascript
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',     // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: 'public',
      table: 'messages',
    },
    (payload) => console.log('New row:', payload.new)
  )
  .subscribe()
```

## Filter Syntax

```javascript
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'messages',
  filter: 'room_id=eq.123',  // Only changes where room_id = 123
}, callback)
```

| Filter | Example |
|--------|---------|
| `eq` | `id=eq.1` |
| `neq` | `status=neq.deleted` |
| `lt`, `lte` | `age=lt.65` |
| `gt`, `gte` | `quantity=gt.10` |
| `in` | `name=in.(red,blue,yellow)` (max 100 values) |

## Receive Old Records on UPDATE/DELETE

By default, only `new` records are sent.

**Incorrect:**

```sql
-- Only new record available in payload
alter publication supabase_realtime add table messages;
```

**Correct:**

```sql
-- Enable old record in payload
alter table messages replica identity full;
alter publication supabase_realtime add table messages;
```

**Caveat:** RLS policies are not applied to DELETE events. With `replica identity
full`, DELETE events still only include primary key columns in the `old` record.

## Scaling Limitation

Each change triggers RLS checks for every subscriber:

```text
100 subscribers = 100 database reads per change
```

Database changes are processed on a single thread to maintain order. Compute
upgrades do not significantly improve Postgres Changes throughput. If your
database cannot authorize changes fast enough, changes are delayed until timeout.

For high-traffic tables, migrate to [broadcast-database.md](broadcast-database.md).

## DELETE Events Not Filterable

Filters don't work on DELETE events due to how Postgres logical replication works.

## Related

- [broadcast-database.md](broadcast-database.md)
- [patterns-cleanup.md](patterns-cleanup.md)
- [Docs](https://supabase.com/docs/guides/realtime/postgres-changes)
