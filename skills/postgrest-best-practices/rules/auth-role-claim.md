---
title: Configure JWT Role Claim for Authorization
impact: MEDIUM
impactDescription: Map JWT claims to PostgreSQL roles for permission control
tags: role, jwt, claims, authorization, permissions
---

## Configure JWT Role Claim for Authorization

PostgREST extracts a role from the JWT to determine database permissions. The role claim determines which PostgreSQL role executes the query.

**Incorrect (missing role in JWT):**

```javascript
// JWT without role claim
const jwt = {
  "sub": "user-123",
  "email": "user@example.com"
  // No role - uses anonymous or default
}
```

**Correct (include role claim):**

```javascript
// JWT with role claim (Supabase default)
const jwt = {
  "sub": "user-123",
  "role": "authenticated",  // PostgreSQL role to use
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704153600
}

// Custom role for different permission levels
const adminJwt = {
  "sub": "admin-123",
  "role": "admin",  // Admin role with elevated permissions
  "email": "admin@example.com"
}
```

**Supabase roles:**

```typescript
// Supabase has two built-in roles
// 1. anon - for unauthenticated requests
// 2. authenticated - for signed-in users

// After sign in, JWT has role: "authenticated"
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
// session.access_token contains role: "authenticated"
```

**PostgreSQL role permissions:**

```sql
-- Grant permissions to the authenticated role
GRANT SELECT ON users TO authenticated;
GRANT INSERT, UPDATE ON posts TO authenticated;

-- Restrict anonymous
GRANT SELECT ON public_content TO anon;
-- No INSERT/UPDATE/DELETE for anon

-- Admin role with full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
```

**Custom role claim path:**

```bash
# PostgREST can read role from nested claim
# Configuration: jwt-role-claim-key = '.app_metadata.role'

# JWT structure
{
  "sub": "user-123",
  "app_metadata": {
    "role": "premium_user"
  }
}
```

**Role switching flow:**
1. Request arrives with JWT
2. PostgREST validates JWT
3. Extracts role from claim (default: `role`)
4. Executes: `SET LOCAL ROLE 'extracted_role'`
5. Query runs with that role's permissions
6. Role reset after request

**Checking current role in SQL:**

```sql
-- In RLS policy or function
SELECT current_user;  -- Returns the role from JWT
SELECT current_setting('request.jwt.claims', true);  -- Full JWT claims
```

Reference: [PostgREST Role System](https://postgrest.org/en/stable/references/auth.html#roles)
