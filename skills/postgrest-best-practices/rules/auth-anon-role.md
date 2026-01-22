---
title: Configure Anonymous Access Appropriately
impact: MEDIUM
impactDescription: Control what unauthenticated users can access
tags: anonymous, anon, public, unauthenticated, security
---

## Configure Anonymous Access Appropriately

The anonymous role handles unauthenticated requests. Configure its permissions carefully - grant only what public users need.

**Incorrect (overly permissive anon):**

```sql
-- DON'T: Anon can access everything
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- Security risk! Public can read/write all data
```

**Correct (minimal anon permissions):**

```sql
-- Only grant what anonymous users need
-- Read-only access to public content
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON public_posts TO anon;

-- No access to sensitive tables
-- (no GRANT = no access)

-- Maybe allow creating accounts
GRANT INSERT ON signups TO anon;
```

```bash
# Anonymous request (no JWT)
curl "http://localhost:3000/products"
# Works - anon has SELECT on products

curl "http://localhost:3000/users"
# 401 or empty - anon has no access to users

curl "http://localhost:3000/products" -X POST -d '{"name": "Test"}'
# Error - anon has no INSERT on products
```

**supabase-js:**

```typescript
// Without auth, uses anon role
const { data: publicProducts } = await supabase
  .from('products')
  .select('*')
// Works if anon has SELECT

// After sign in, uses authenticated role
await supabase.auth.signInWithPassword({ email, password })
const { data: allData } = await supabase
  .from('users')
  .select('*')
// Works if authenticated has SELECT
```

**RLS with anonymous:**

```sql
-- Public products visible to everyone (including anon)
CREATE POLICY "Public products" ON products
  FOR SELECT
  USING (is_public = true);

-- Private products need authentication
CREATE POLICY "Private products" ON products
  FOR SELECT
  USING (is_public = false AND auth.role() = 'authenticated');
```

**Common anon patterns:**

```sql
-- Public read, authenticated write
GRANT SELECT ON posts TO anon;
GRANT SELECT ON posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;

-- Rate-limited signup
GRANT INSERT ON newsletter_signups TO anon;
-- (Rate limiting via RLS or API gateway)

-- Public API for read-only data
GRANT SELECT ON api_docs TO anon;
GRANT SELECT ON public_stats TO anon;
```

**Security checklist for anon:**
- [ ] Only SELECT on truly public tables
- [ ] No access to user data, auth tables
- [ ] No INSERT/UPDATE/DELETE on critical tables
- [ ] RLS policies handle anon correctly
- [ ] Rate limiting for anon endpoints (API gateway)

**Disable anonymous access entirely:**

```sql
-- Revoke all from anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
-- All requests now require JWT
```

Reference: [PostgREST Anonymous Role](https://postgrest.org/en/stable/references/auth.html#anonymous-role)
