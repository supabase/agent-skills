---
title: Use security_definer Functions in Private Schema
impact: HIGH
impactDescription: Controlled privilege escalation without exposing service role
tags: functions, security_definer, security, private-schema
---

## Use security_definer Functions in Private Schema

`security definer` functions run with the privileges of the function owner, not
the caller. Place them in a private schema to prevent direct API access.

**Incorrect:**

```sql
-- DANGEROUS: Exposed via API, can be called directly
create function public.get_all_users()
returns setof auth.users
language sql
security definer
as $$
  select * from auth.users;  -- Bypasses RLS!
$$;
```

**Correct:**

```sql
-- Create private schema (not exposed to API)
create schema if not exists private;

-- Function in private schema
create function private.get_all_users()
returns setof auth.users
language sql
security definer
set search_path = ''  -- Prevent search_path injection
as $$
  select * from auth.users;
$$;

-- Wrapper in public schema with access control
create function public.get_user_count()
returns bigint
language sql
security invoker  -- Runs as caller
as $$
  select count(*) from private.get_all_users()
  where (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$;
```

## Common Use Cases

### 1. Admin Operations

```sql
create function private.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Verify caller is admin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' then
    raise exception 'Unauthorized';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;
```

### 2. Cross-User Data Access

```sql
-- Function returns team IDs the current user belongs to
create function private.user_teams()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select team_id from public.team_members
  where user_id = (select auth.uid());
$$;

-- RLS policy uses cached function result (no per-row join)
create policy "Team members see team data" on team_data
  for select to authenticated
  using (team_id in (select private.user_teams()));
```

## Security Best Practices

1. **Always set search_path = ''** - Prevents search_path injection attacks
2. **Validate caller permissions** - Don't assume caller is authorized
3. **Keep functions minimal** - Only expose necessary operations
4. **Log sensitive operations** - Audit trail for admin actions

```sql
create function private.sensitive_operation()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Log the operation
  insert into audit_log (user_id, action, timestamp)
  values ((select auth.uid()), 'sensitive_operation', now());

  -- Perform operation
  -- ...
end;
$$;
```

## Related

- [security-service-role.md](security-service-role.md)
- [rls-performance.md](rls-performance.md)
- [Docs](https://supabase.com/docs/guides/database/functions)
