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

  -- Use the Supabase Admin API to delete users instead of direct table access
  -- Direct DML on auth.users is unsupported and may break auth internals
  delete from public.profiles where id = target_user_id;
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

-- Revoke default public access, grant only to authenticated
revoke execute on function private.user_teams from public;
grant execute on function private.user_teams to authenticated;

-- RLS policy uses cached function result (no per-row join)
create policy "Team members see team data" on team_data
  for select to authenticated
  using (team_id in (select private.user_teams()));
```

## Security Best Practices

1. **Always set search_path = ''** - Prevents search_path injection attacks. Qualify all table references (e.g., `public.my_table`)
2. **Revoke default execute permissions** - `revoke execute on function my_func from public;` then grant selectively
3. **Validate caller permissions** - Don't assume caller is authorized
4. **Keep functions minimal** - Only expose necessary operations
5. **Log sensitive operations** - Audit trail for admin actions
6. **Never directly modify `auth.users`** - Use the Supabase Admin API instead
7. **JWT freshness caveat** - `auth.jwt()` values reflect the JWT at issuance time. Changes to `app_metadata` (e.g., removing a role) are not reflected until the JWT is refreshed

```sql
create function private.sensitive_operation()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Log the operation
  insert into public.audit_log (user_id, action, timestamp)
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
