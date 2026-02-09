---
title: Use RESTRICTIVE vs PERMISSIVE Policies
impact: MEDIUM-HIGH
impactDescription: Controls policy combination logic to prevent unintended access
tags: rls, policies, permissive, restrictive
---

## Use RESTRICTIVE vs PERMISSIVE Policies

Supabase RLS supports two policy types with different combination logic.

## PERMISSIVE (Default)

Multiple permissive policies combine with OR logic. If ANY policy passes, access
is granted.

```sql
-- User can access if they own it OR are an admin
create policy "Owner access" on documents
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Admin access" on documents
  for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

## RESTRICTIVE

Restrictive policies combine with AND logic. ALL restrictive policies must pass.

**Use Case: Enforce MFA for sensitive operations**

```sql
-- Base access policy (permissive)
create policy "Users can view own data" on sensitive_data
  for select to authenticated
  using (user_id = (select auth.uid()));

-- MFA requirement (restrictive) - MUST also pass
create policy "Require MFA" on sensitive_data
  as restrictive
  for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');
```

**Use Case: Block OAuth client access**

```sql
-- Allow direct session access
create policy "Direct access only" on payment_methods
  as restrictive
  for all to authenticated
  using ((select auth.jwt() ->> 'client_id') is null);
```

## Common Mistake

**Incorrect:**

```sql
-- Intended as additional requirement, but PERMISSIVE means OR
create policy "Require MFA" on sensitive_data
  for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');
```

**Correct:**

```sql
-- AS RESTRICTIVE makes it an AND requirement
create policy "Require MFA" on sensitive_data
  as restrictive
  for select to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');
```

## Related

- [rls-common-mistakes.md](rls-common-mistakes.md)
- [Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
