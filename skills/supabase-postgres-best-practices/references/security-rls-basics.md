---
title: Enable Row Level Security for Multi-Tenant Data
impact: CRITICAL
impactDescription: Database-enforced tenant isolation, prevent data leaks
tags: rls, row-level-security, multi-tenant, security
---

## Enable Row Level Security for Multi-Tenant Data

Row Level Security (RLS) enforces data access at the database level, ensuring users only see their own data.

**Incorrect (application-level filtering only):**

```sql
-- Relying only on application to filter
select * from orders where user_id = $current_user_id;

-- Bug or bypass means all data is exposed!
select * from orders;  -- Returns ALL orders
```

**Correct (database-enforced RLS):**

```sql
-- Enable RLS on the table
alter table orders enable row level security;

-- Create policy for users to see only their orders
-- A missing or empty setting matches no rows instead of raising an error
create policy orders_user_policy on orders
  for all
  using (user_id = nullif(current_setting('app.current_user_id', true), '')::bigint);

-- Force RLS even for table owners
alter table orders force row level security;

-- Set user context for this transaction only, then query
begin;
select set_config('app.current_user_id', '123', true);  -- or: set local app.current_user_id = '123';
select * from orders;  -- Only returns orders for user 123
commit;  -- Setting is cleared, so the next request on a pooled connection sees no rows
```

Never set the user with a plain `set` or `set_config(..., false)`. Those last for the whole session, so behind a transaction-mode pooler (Supavisor, PgBouncer) the next request that reuses the connection still sees user 123's rows. Run `set local` or `set_config(..., true)` inside the same transaction as the queries. Outside `begin ... commit`, `set local` has no effect.

This pattern is for an application that sets the user id server-side. Never take the value from client input. On Supabase, use `auth.uid()` instead. It reads the user from the JWT that the Data API sets for each request's transaction.

Policy for authenticated role:

```sql
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = auth.uid());
```

Reference: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
