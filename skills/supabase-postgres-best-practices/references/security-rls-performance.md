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

`SECURITY DEFINER` functions run with the creator's privileges and bypass RLS on any tables they touch — which is what makes them useful for internal lookups, but also what makes them dangerous if misused. Always include an explicit `auth.uid()` check inside the function body and keep helpers in a non-exposed schema. Revoke `EXECUTE` from roles that should not invoke the helper. Roles whose RLS policies evaluate through a stored helper still need `EXECUTE` on that exact function; `SECURITY DEFINER` does not remove that caller privilege check. Direct schema lookups normally require schema `USAGE`, but an RLS policy created with the helper already resolved stores the function OID, so the policy-calling role does not need schema-wide `USAGE` merely to evaluate that stored helper. Keeping schema `USAGE` revoked reduces unnecessary access to other private-schema objects.

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

-- Grant only exact helper EXECUTE to the policy-calling role.
-- Do not grant schema-wide USAGE on private merely for this stored policy helper.
grant execute on function private.is_team_member(bigint) to authenticated;

-- Use in policy (indexed lookup, not per-row check)
create policy team_orders_policy on orders
  to authenticated
  using ((select private.is_team_member(team_id)));
```

Keep the helper schema out of PostgREST's exposed schemas. Omitting schema `USAGE` for `authenticated` does not prevent a stored RLS policy from calling the already-resolved helper; it only limits broader resolution of other private-schema objects.

Verify the intended allowlist, then exercise the real policy role:

```sql
begin;

-- Inspect privileges for the policy role (named lookup needs a privileged session
-- when private schema USAGE is intentionally withheld)
select
  has_schema_privilege('authenticated', 'private', 'USAGE') as can_use_private_schema,
  has_function_privilege(
    'authenticated',
    'private.is_team_member(bigint)',
    'EXECUTE'
  ) as can_execute_helper;
-- Intended: can_use_private_schema = false, can_execute_helper = true

-- Exercise a query protected by the policy under this role
set local role authenticated;
-- select ... from orders; -- succeeds for an allowed member via the stored policy helper

rollback;
```
Always add indexes on columns used in RLS policies:

```sql
create index orders_user_id_idx on orders (user_id);
```

Reference: [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
