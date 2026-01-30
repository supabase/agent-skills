---
title: Use security_invoker for Views with RLS
impact: HIGH
impactDescription: Ensures views respect RLS policies instead of bypassing them
tags: rls, views, security_invoker, security
---

## Use security_invoker for Views with RLS

By default, views run as the view owner (security definer), bypassing RLS on
underlying tables.

**Incorrect:**

```sql
-- View bypasses RLS - exposes all data!
create view public_profiles as
  select id, username, avatar_url
  from profiles;
```

**Correct (Postgres 15+):**

```sql
-- View respects RLS of querying user
create view public_profiles
with (security_invoker = true)
as
  select id, username, avatar_url
  from profiles;
```

**Correct (Older Postgres):**

```sql
-- Option 1: Revoke direct access, create RLS on view
revoke all on public_profiles from anon, authenticated;

-- Option 2: Create view in unexposed schema
create schema private;
create view private.profiles_view as
  select * from profiles;
```

## When to Use security_definer

Use `security_definer = true` (default) when the view intentionally aggregates
or filters data that users shouldn't access directly:

```sql
-- Intentionally exposes limited public data
create view leaderboard as
  select username, score
  from profiles
  order by score desc
  limit 100;

-- Grant read access
grant select on leaderboard to anon;
```

## Related

- [rls-mandatory.md](rls-mandatory.md)
- [Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
