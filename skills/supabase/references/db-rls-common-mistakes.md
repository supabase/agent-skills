---
title: Avoid Common RLS Policy Mistakes
impact: CRITICAL
impactDescription: Prevents security vulnerabilities and unintended data exposure
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
  using (auth.uid() = user_id);
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
using (auth.uid() is not null and auth.uid() = user_id)
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
  using (auth.uid() = user_id);

create policy "Users can update" on profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Related

- [rls-mandatory.md](rls-mandatory.md)
- [Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
