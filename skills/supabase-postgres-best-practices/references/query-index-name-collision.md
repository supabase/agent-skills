---
title: Verify Index Definitions Before Trusting CREATE INDEX IF NOT EXISTS
impact: HIGH
impactDescription: Same 10-100x cost as a missing index, but silent -- the migration exits 0 while the intended index was never created
tags: indexes, migrations, idempotency, query-optimization
---

## Verify Index Definitions Before Trusting CREATE INDEX IF NOT EXISTS

`CREATE INDEX IF NOT EXISTS <name> ON ...` only checks whether an index with that literal *name* already exists -- it never compares the existing index's definition (columns, expression, partial predicate) to the one being created. If the name collides with an unrelated index from an earlier migration or a manual hotfix, the statement silently no-ops: exit code 0, no error, no warning, and the index actually intended is never created.

**Incorrect (name collision silently swallowed):**

```sql
-- An earlier migration (or a manual hotfix run directly against the
-- database) already created an index under this name, on a different column
create index orders_status_idx on orders (created_at);

-- A later migration intends to index `status` and reuses the same name...
create index if not exists orders_status_idx on orders (status);
-- ...and silently does nothing. orders_status_idx still indexes
-- created_at, not status. Exit code 0 -- the migration "passes".

select * from orders where status = 'pending';
-- Still a sequential scan: the index this query needed was never created
```

**Correct (verify the live definition, then use a name guaranteed unique):**

```sql
-- Check what's actually live before trusting the name
select indexdef from pg_indexes
where schemaname = 'public' and indexname = 'orders_status_idx';
-- indexdef: CREATE INDEX orders_status_idx ON public.orders USING btree (created_at)
-- Confirms the name is already taken by a different index -- pick a new one

create index if not exists orders_status_idx_v2 on orders (status);

select * from orders where status = 'pending';
-- Index Scan using orders_status_idx_v2
```

Alternative: give the index a name unique to its exact definition so a genuine collision raises a real, visible error instead of a silent no-op:

```sql
create index orders_status_pending_idx on orders (status)
where status = 'pending';
-- ERROR:  relation "orders_status_pending_idx" already exists
-- A real collision is caught immediately, not discovered months later
-- when the query it was supposed to speed up is still slow
```

Never assume a migration's success implies the intended schema is now live -- `IF NOT EXISTS` guarantees the statement didn't error, not that it did what you meant. When a name isn't provably unique to this migration, verify against `pg_indexes` (or `\d <table>` in `psql`) first.

Reference: [pg_indexes](https://www.postgresql.org/docs/current/view-pg-indexes.html)
