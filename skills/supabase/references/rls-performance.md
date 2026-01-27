---
title: Optimize RLS Policy Performance
impact: CRITICAL
impactDescription: Achieve 100x-99,000x query performance improvements
tags: rls, performance, optimization, indexes, auth.uid
---

## Optimize RLS Policy Performance

RLS policies run on every row access. Unoptimized policies cause severe
performance degradation.

## 1. Wrap auth.uid() in SELECT (94-99% improvement)

**Incorrect:**

```sql
-- auth.uid() called for every row
create policy "Users see own data" on profiles
  to authenticated
  using (auth.uid() = user_id);
```

**Correct:**

```sql
-- Cached once per statement via initPlan
create policy "Users see own data" on profiles
  to authenticated
  using ((select auth.uid()) = user_id);
```

## 2. Add Indexes on Policy Columns (99% improvement)

**Incorrect:**

```sql
-- Full table scan for every query
create policy "Users see own data" on profiles
  using ((select auth.uid()) = user_id);
-- No index on user_id
```

**Correct:**

```sql
create policy "Users see own data" on profiles
  using ((select auth.uid()) = user_id);

-- Add index on filtered column
create index idx_profiles_user_id on profiles(user_id);
```

## 3. Use Explicit Filters in Queries (94% improvement)

**Incorrect:**

```javascript
// Relies only on implicit RLS filter
const { data } = await supabase.from("profiles").select("*");
```

**Correct:**

```javascript
// Add explicit filter - helps query planner
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", userId);
```

## 4. Use Security Definer Functions for Joins

**Incorrect:**

```sql
-- Join in policy - executed per row
using (
  user_id in (
    select user_id from team_members
    where team_id = teams.id  -- joins!
  )
)
```

**Correct:**

```sql
-- Function in private schema
create function private.user_team_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select team_id from team_members
  where user_id = (select auth.uid())
$$;

-- Policy uses cached function result
using (team_id in (select private.user_team_ids()))
```

## Related

- [security-functions.md](security-functions.md)
- [Supabase RLS Performance Guide](https://github.com/orgs/supabase/discussions/14576)
