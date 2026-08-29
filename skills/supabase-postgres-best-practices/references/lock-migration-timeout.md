---
title: Set lock_timeout Before Running Schema-Changing Migrations
impact: MEDIUM-HIGH
impactDescription: Aborts a stuck migration in seconds instead of blocking all reads and writes until it is manually killed
tags: locking, migrations, ddl, lock-timeout, rls
---

## Set lock_timeout Before Running Schema-Changing Migrations

DDL that changes table metadata -- `CREATE POLICY`, `DROP POLICY`, most forms of `ALTER TABLE`, `CREATE TRIGGER` -- takes an `ACCESS EXCLUSIVE` lock, which blocks every concurrent reader and writer on that table until the migration's transaction commits. Without a `lock_timeout`, a migration that can't immediately acquire the lock waits indefinitely instead of failing fast.

**Incorrect (no lock_timeout, waits indefinitely):**

```sql
begin;

create policy orders_owner_policy on orders
  for select
  using ((select auth.uid()) = user_id);

commit;

-- If any other transaction already holds so much as a row lock on
-- orders, this migration queues behind it waiting for ACCESS EXCLUSIVE --
-- and every write to orders queues behind the migration in turn. A
-- webhook handler updating an order times out, its caller retries, and
-- the retries pile up behind the same lock until the migration finally
-- commits or someone kills it manually.
```

**Correct (fails fast instead of blocking traffic):**

```sql
begin;

-- Give up after 3s if the lock can't be acquired. Policy and trigger DDL
-- is metadata-only and normally acquires the lock in well under a second
-- on a healthy table, so 3s is generous headroom, not a tight budget.
set local lock_timeout = '3s';

create policy orders_owner_policy on orders
  for select
  using ((select auth.uid()) = user_id);

commit;

-- On timeout: ERROR:  canceling statement due to lock timeout
-- The migration fails loudly and rolls back -- no blocked reads, no
-- queued writers, no retry storm. Re-run once the blocking session clears.
```

A common misconception: connecting as `service_role` or a superuser does not help. Those roles bypass **RLS policy evaluation** -- which rows are visible -- not the **table-level lock** the DDL itself takes, which Postgres enforces regardless of the connecting role. Running the migration through a session-mode vs. transaction-mode pooler makes no difference either; lock semantics are identical at the database level in both cases.

`lock_timeout` only bounds how long the migration waits to *acquire* the lock, not how long the DDL runs once granted -- reserve a longer timeout (or a maintenance window) for statements that actually rewrite table data, such as adding a column with a volatile default or changing a column's type. `set local` scopes the timeout to the current transaction so it can't leak into the session that runs the next migration.

Reference: [lock_timeout (Client Connection Defaults)](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-LOCK-TIMEOUT)
