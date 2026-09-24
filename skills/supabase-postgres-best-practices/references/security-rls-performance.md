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

`SECURITY DEFINER` functions run with the creator's privileges and bypass RLS on any tables they touch — which is what makes them useful for internal lookups, but also what makes them dangerous if misused. Always include an explicit `auth.uid()` check inside the function body, keep them in a non-exposed schema, and revoke `EXECUTE` from any role that shouldn't call them directly.

One exception to keep in mind: a role evaluating an RLS policy needs `EXECUTE` on every function that policy references, because Postgres evaluates the policy expression with the calling role's privileges. Revoking `EXECUTE` from a role whose queries can trigger the policy breaks its queries with `permission denied for function ...` (SQLSTATE 42501). The pattern below revokes from `PUBLIC` to block uninvited direct calls, then grants `EXECUTE` only to the roles that legitimately evaluate the policy:

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

-- Block direct calls from everyone first ...
revoke execute on function private.is_team_member(bigint) from PUBLIC;

-- ... then grant EXECUTE back to exactly the roles whose queries
-- evaluate this policy. authenticated users query orders, so they need it.
grant execute on function private.is_team_member(bigint) to authenticated;

-- If an anon-facing policy on this table also calls the helper,
-- anon needs EXECUTE too; likewise service_role for server-side paths.
-- grant execute on function private.is_team_member(bigint) to anon;
-- grant execute on function private.is_team_member(bigint) to service_role;

-- Internal helpers reached ONLY through other definer functions or
-- triggers (never referenced by a policy or view) can stay fully revoked:
-- no role evaluates them directly.

-- Use in policy (indexed lookup, not per-row check)
create policy team_orders_policy on orders
  using ((select private.is_team_member(team_id)));
```

The same rule applies to functions called inside view definitions: a role selecting through the view needs `EXECUTE` on those functions as well (`security_invoker` views evaluate with the querying role's privileges; definer views with the owner's, which usually already holds the grant). When queries start failing with 42501 after a hardening pass, check whether a recently revoked helper is referenced by a live policy or view before assuming the revoke was wrong — restore the narrowly scoped grant instead of dropping the helper from the policy.

Always add indexes on columns used in RLS policies:

```sql
create index orders_user_id_idx on orders (user_id);
```

Reference: [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
