---
title: Never Expose Service Role Key to Browser
impact: CRITICAL
impactDescription: Prevents complete database compromise and data breach
tags: service-role, security, api-keys, anon-key
---

## Never Expose Service Role Key to Browser

The service role key bypasses ALL Row Level Security. Exposing it gives complete
database access to anyone.

**Incorrect:**

```javascript
// NEVER do this - service key in frontend code!
const supabase = createClient(
  "https://xxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // service_role key
);
```

**Correct:**

```javascript
// Browser: Use anon key (respects RLS)
const supabase = createClient(
  "https://xxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // anon key
);
```

## When to Use Service Role Key

Only in server-side code that users cannot access:

```javascript
// Edge Function or backend server
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Only in secure backend
);

// Bypass RLS for admin operations
const { data } = await supabaseAdmin.from("users").select("*");
```

## Environment Variables

```bash
## .env.local (never commit to git!)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Safe to expose
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # NEVER prefix with NEXT_PUBLIC_
```

## API Key Types

Supabase provides 4 key types:

| Type | Format | Privileges |
|------|--------|-----------|
| Publishable key | `sb_publishable_...` | Low — safe to expose in browsers/apps |
| Secret key | `sb_secret_...` | Elevated — bypasses RLS, backend only |
| `anon` (legacy) | JWT | Same as publishable |
| `service_role` (legacy) | JWT | Same as secret key |

The publishable and secret keys are replacing the legacy JWT-based keys. Decode legacy JWTs at [jwt.io](https://jwt.io) to verify: `role` claim is `anon` or `service_role`.

## If Service Key is Exposed

1. Immediately rotate keys in Dashboard > Settings > API Keys
2. Review database for unauthorized changes
3. Check logs for suspicious activity
4. Update all backend services with new key

## Alternative: Security Definer Functions

Instead of service role, use security definer functions for specific elevated
operations:

```sql
-- Runs with function owner's privileges
create function admin_get_user_count()
returns bigint
language sql
security definer
set search_path = ''
as $$
  select count(*) from auth.users;
$$;

-- Grant to authenticated users
grant execute on function admin_get_user_count to authenticated;
```

## Related

- [security-functions.md](security-functions.md)
- [rls-mandatory.md](rls-mandatory.md)
- [Docs](https://supabase.com/docs/guides/api/api-keys)
