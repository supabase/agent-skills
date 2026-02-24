---
title: Avoid Common RLS Policy Mistakes
tags: rls, security, auth.uid, policies, common-mistakes
---

## Avoid Common RLS Policy Mistakes

## 1. Missing TO Clause

Without `TO`, policies apply to all roles including `anon`.

**Incorrect:**

```sql
-- Runs for both anon and authenticated users
create policy "Users see own data" on profiles
  using (auth.uid() = user_id);
```

**Correct:**

```sql
-- Only runs for authenticated users
create policy "Users see own data" on profiles
  to authenticated
  using ((select auth.uid()) = user_id);
```

## 2. Using user_metadata for Authorization

Users can modify their own `user_metadata`. Use `app_metadata` instead.

**Incorrect:**

```sql
-- DANGEROUS: users can set their own role!
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
```

**Correct:**

```sql
-- app_metadata cannot be modified by users
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
```

## 3. Not Checking NULL auth.uid()

For unauthenticated users, `auth.uid()` returns NULL.

**Incorrect:**

```sql
-- NULL = NULL is NULL (not true), but confusing behavior
using (auth.uid() = user_id)
```

**Correct:**

```sql
-- Explicit NULL check
create policy "Users see own data" on profiles
  for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
```

## 4. Missing SELECT Policy for UPDATE

UPDATE operations require a SELECT policy to find rows to update.

**Incorrect:**

```sql
-- UPDATE silently fails - no rows found
create policy "Users can update" on profiles
  for update to authenticated
  using (auth.uid() = user_id);
```

**Correct:**

```sql
-- Need both SELECT and UPDATE policies
create policy "Users can view" on profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update" on profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

## 5. Bare auth.uid() Instead of Subselect

Bare `auth.uid()` is re-evaluated for every row. Wrap in a subselect so
Postgres evaluates it once per query.

**Incorrect:**

```sql
-- Re-evaluated per row, prevents index usage
using (auth.uid() = user_id)
```

**Correct:**

```sql
-- Evaluated once, allows index scans
using ((select auth.uid()) = user_id)
```

See [db-rls-performance.md](db-rls-performance.md) for details.

## Related

- [rls-mandatory.md](rls-mandatory.md)
- [Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
