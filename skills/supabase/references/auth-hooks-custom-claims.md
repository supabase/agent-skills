---
title: Add Custom Claims to JWT via Auth Hooks
impact: HIGH
impactDescription: Custom claims enable role-based access without database lookups in every request
tags: auth, hooks, jwt, claims, rbac, roles, permissions
---

## Add Custom Claims to JWT via Auth Hooks

Use the Custom Access Token Hook to add custom claims (roles, permissions, tenant IDs) to JWTs. Claims are then available in RLS policies without database lookups.

## When to Use

- **Role-based access control (RBAC)**: Add user roles to JWT
- **Multi-tenancy**: Add organization/tenant ID
- **Feature flags**: Add subscription tier or enabled features
- **Reduce RLS complexity**: Avoid joins in every policy

## Setup

### Step 1: Create the Hook Function

```sql
-- Create a roles table (if needed)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'moderator', 'user')),
  unique(user_id)
);

-- Create the hook function
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  -- Get user's role from your table
  select role into user_role
  from public.user_roles
  where user_id = (event ->> 'user_id')::uuid;

  -- Get existing claims
  claims := event -> 'claims';

  -- Add custom claims
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"user"'); -- Default role
  end if;

  -- Return modified event
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Grant required permissions
grant usage on schema public to supabase_auth_admin;
grant all on table public.user_roles to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Revoke from other roles for security
revoke all on table public.user_roles from authenticated, anon, public;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

### Step 2: Enable the Hook

Stop and ask the user to enable the hook in the Supabase Dashboard under Auth > Hooks > Customize Access Token (JWT) Claims, and select the function `public.custom_access_token_hook`.

### Step 3: Use Claims in RLS Policies

```sql
-- Check role in policy
create policy "Admins can delete"
  on posts for delete
  to authenticated
  using ((auth.jwt() ->> 'user_role') = 'admin');

-- Check multiple roles
create policy "Moderators and admins can update"
  on posts for update
  to authenticated
  using ((auth.jwt() ->> 'user_role') in ('admin', 'moderator'));
```

## Multi-Tenant Example

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  org_id uuid;
begin
  -- Get user's organization
  select organization_id into org_id
  from public.organization_members
  where user_id = (event ->> 'user_id')::uuid
  limit 1;

  claims := event -> 'claims';

  if org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(org_id));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;
```

Use in RLS:

```sql
create policy "Users see org data"
  on organization_data for select
  to authenticated
  using (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

## Common Mistakes

### 1. Expensive Queries in Hook

**Incorrect:**

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
as $$
begin
  -- Multiple joins and complex query - slows every token refresh
  select ... from users
    join organizations on ...
    join permissions on ...
    join features on ...
  -- This runs on every sign-in and token refresh!
end;
$$;
```

**Correct:**

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable  -- Mark as stable for potential caching
as $$
declare
  claims jsonb;
  user_role text;
begin
  -- Simple indexed lookup
  select role into user_role
  from public.user_roles
  where user_id = (event ->> 'user_id')::uuid;

  -- Keep it fast
  claims := event -> 'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role, 'user')));
  return jsonb_set(event, '{claims}', claims);
end;
$$;
```

### 2. Not Handling NULL Values

**Incorrect:**

```sql
-- If no role found, sets claim to null (may cause issues)
claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
```

**Correct:**

```sql
-- Provide default value
claims := jsonb_set(claims, '{role}', to_jsonb(coalesce(user_role, 'user')));
```

### 3. Forgetting Claims are Cached in JWT

**Issue:** JWT claims don't update until token refresh (default: 1 hour).

**Incorrect:**

```typescript
// Change user role
await updateUserRole(userId, 'admin')
// User won't see new role until token refresh
```

**Correct:**

```typescript
// Change user role
await updateUserRole(userId, 'admin')

// Force session refresh to get new claims
await supabase.auth.refreshSession()
```

Or inform user:

```typescript
showMessage('Your role has been updated. Changes will take effect within an hour.')
```

### 4. Hook Function in Public Schema Without Protection

**Incorrect:**

```sql
-- Function accessible via API if in public schema without restrictions
create function public.custom_access_token_hook(event jsonb)
returns jsonb as $$ ... $$;
```

**Correct:**

```sql
-- Revoke access from API-accessible roles
revoke execute on function public.custom_access_token_hook
  from authenticated, anon, public;

-- Only supabase_auth_admin should call it
grant execute on function public.custom_access_token_hook
  to supabase_auth_admin;
```

## Hook Input Fields

The hook receives a JSON event with:

- `user_id` - UUID of the user requesting the token
- `claims` - existing JWT claims to modify
- `authentication_method` - how the user authenticated (`password`, `otp`, `oauth`, `totp`, `recovery`, `invite`, `sso/saml`, `magiclink`, `email/signup`, `email_change`, `token_refresh`, `anonymous`)

## JWT Claims Structure After Hook

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@example.com",
  "user_role": "admin",        // Your custom claim
  "org_id": "org-uuid",        // Your custom claim
  "aal": "aal1",
  "session_id": "session-uuid"
}
```

Access in client (for display only - use RLS for authorization):

```typescript
import { jwtDecode } from 'jwt-decode'

const { data: { session } } = await supabase.auth.getSession()
if (session?.access_token) {
  const decoded = jwtDecode<{ user_role?: string }>(session.access_token)
  const userRole = decoded.user_role // Your custom claim
}

// Note: Custom claims are in the JWT payload, NOT in user_metadata
// For authorization, use auth.jwt() in RLS policies instead
```

## Related

- [hooks-send-email.md](hooks-send-email.md) - Custom email hooks
- [../db/rls-common-mistakes.md](../db/rls-common-mistakes.md) - RLS patterns
- [Docs: Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
