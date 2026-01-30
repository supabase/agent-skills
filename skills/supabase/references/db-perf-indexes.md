---
title: Choose the Right Index Type
impact: CRITICAL
impactDescription: 10-1000x query performance improvements with proper indexing
tags: indexes, performance, btree, brin, gin, partial
---

## Choose the Right Index Type

Supabase uses PostgreSQL indexes. Choose the right type for your query patterns.

## B-Tree (Default)

Best for: Equality, range queries, sorting.

```sql
-- Equality and range queries
create index idx_users_email on users(email);
create index idx_orders_created on orders(created_at);

-- Composite index for multi-column queries
create index idx_orders_user_status on orders(user_id, status);
```

## BRIN (Block Range Index)

Best for: Large tables with naturally ordered data (timestamps, sequential IDs).
10x+ smaller than B-tree.

```sql
-- Perfect for append-only timestamp columns
create index idx_logs_created on logs using brin(created_at);
create index idx_events_id on events using brin(id);
```

**When to use:** Tables with millions of rows where data is inserted in order.

## GIN (Generalized Inverted Index)

Best for: JSONB, arrays, full-text search.

```sql
-- JSONB containment queries
create index idx_users_metadata on users using gin(metadata);

-- Full-text search
create index idx_posts_search on posts using gin(to_tsvector('english', title || ' ' || content));

-- Array containment
create index idx_tags on posts using gin(tags);
```

## Partial Index

Best for: Queries that filter on specific values.

```sql
-- Only index active users (smaller, faster)
create index idx_active_users on users(email)
where status = 'active';

-- Only index unprocessed orders
create index idx_pending_orders on orders(created_at)
where processed = false;
```

**Requirement:** Query WHERE clause must match index condition.

## Common Mistakes

**Incorrect:**

```sql
-- Over-indexing: slows writes, wastes space
create index idx_users_1 on users(email);
create index idx_users_2 on users(email, name);
create index idx_users_3 on users(name, email);
create index idx_users_4 on users(name);
```

**Correct:**

```sql
-- Minimal indexes based on actual queries
create index idx_users_email on users(email);  -- For login
create index idx_users_name on users(name);    -- For search
```

## Verify Index Usage

```sql
-- Check if query uses index
explain analyze
select * from users where email = 'test@example.com';

-- Find unused indexes
select * from pg_stat_user_indexes
where idx_scan = 0 and indexrelname not like '%_pkey';
```

## Concurrently Create Indexes

For production tables, avoid locking:

```sql
-- Doesn't block writes
create index concurrently idx_users_email on users(email);
```

## Related

- [rls-performance.md](rls-performance.md)
- [schema-jsonb.md](schema-jsonb.md)
- [Docs](https://supabase.com/docs/guides/database/postgres/indexes)
