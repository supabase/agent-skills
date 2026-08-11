---
title: Optimize RLS Policies for Performance
impact: HIGH
impactDescription: 5-10x faster RLS queries with proper patterns
tags: rls, performance, security, optimization
---

## Optimize RLS Policies for Performance

Poorly written RLS policies can cause severe performance issues. Use subqueries and indexes strategically.

**Incorrect (function called for every row):**

```sql
create policy orders_policy on orders
  using (auth.uid() = user_id);  -- auth.uid() called per row!

-- With 1M rows, auth.uid() is called 1M times
```

**Correct (wrap functions in SELECT):**

```sql
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);  -- Called once, cached

-- 100x+ faster on large tables
```

Use security definer functions for complex checks:

`SECURITY DEFINER` functions run with the creator's privileges and bypass RLS on any tables they touch — which is what makes them useful for internal lookups, but also what makes them dangerous if misused. Always include an explicit `auth.uid()` check inside the function body and keep helpers in a non-exposed schema. Revoke `EXECUTE` from roles that should not invoke the helper, but roles whose RLS policies evaluate through it still need schema `USAGE` and function `EXECUTE`. `SECURITY DEFINER` does not remove that caller privilege check.

```sql
-- Create helper function in a private schema
create or replace function private.is_team_member(team_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    -- always check the calling user's identity inside the function
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

-- Revoke broad/default execution; keep anonymous callers out
revoke execute on function private.is_team_member(bigint) from PUBLIC;
revoke execute on function private.is_team_member(bigint) from anon;

-- Authenticated policy evaluation still requires schema USAGE + EXECUTE
grant usage on schema private to authenticated;
grant execute on function private.is_team_member(bigint) to authenticated;

-- Use in policy (indexed lookup, not per-row check)
create policy team_orders_policy on orders
  to authenticated
  using ((select private.is_team_member(team_id)));
```

Keep the helper schema out of PostgREST's exposed schemas. Schema `USAGE` for `authenticated` only allows PostgreSQL to resolve the helper during policy evaluation; it does not publish the schema through the Data API.

Verify the allowlist under the real policy role before relying on application traffic:

```sql
begin;

set local role authenticated;

select
  has_schema_privilege(current_user, 'private', 'USAGE') as can_use_private_schema,
  has_function_privilege(
    current_user,
    'private.is_team_member(bigint)',
    'EXECUTE'
  ) as can_execute_helper;

-- Also exercise a query protected by the policy under this role
-- against your real application schema.

rollback;
```

Always add indexes on columns used in RLS policies:

```sql
create index orders_user_id_idx on orders (user_id);
```

Reference: [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
