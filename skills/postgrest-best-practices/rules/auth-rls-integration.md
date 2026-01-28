---
title: Combine PostgREST with Row-Level Security
impact: HIGH
impactDescription: Enforce data access rules at database level for true security
tags: rls, row-level-security, authorization, policies
---

## Combine PostgREST with Row-Level Security

Use PostgreSQL Row-Level Security (RLS) with PostgREST for fine-grained access control. RLS policies run at the database level, ensuring security even if API is bypassed.

**Incorrect (application-level filtering only):**

```bash
# Filtering in query - can be bypassed!
curl "http://localhost:3000/posts?user_id=eq.123"
# User could request another user's posts

# No RLS means any authenticated user can see anything
```

**Correct (RLS policies enforce access):**

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own posts
CREATE POLICY "Users see own posts" ON posts
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert their own posts
CREATE POLICY "Users insert own posts" ON posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own posts
CREATE POLICY "Users update own posts" ON posts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own posts
CREATE POLICY "Users delete own posts" ON posts
  FOR DELETE
  USING (user_id = auth.uid());
```

```bash
# Now this query is automatically filtered by RLS
curl "http://localhost:3000/posts" \
  -H "Authorization: Bearer user-jwt"
# Only returns posts belonging to authenticated user
```

**supabase-js:**

```typescript
// RLS automatically applies
const { data: posts } = await supabase
  .from('posts')
  .select('*')
// Only returns current user's posts (RLS enforced)

// Trying to access others' data fails silently (returns empty)
// or errors if policy denies
```

**Supabase auth helper functions:**

```sql
-- Note: auth.uid(), auth.jwt(), auth.role() are SUPABASE-SPECIFIC helpers.
-- For pure PostgREST, use current_setting() instead:

-- Supabase: auth.uid()
-- PostgREST: current_setting('request.jwt.claim.sub', true)::uuid
CREATE POLICY "Own data" ON profiles
  FOR ALL
  USING (id = auth.uid());  -- Supabase

-- Supabase: auth.jwt()
-- PostgREST: current_setting('request.jwt.claims', true)::json
CREATE POLICY "Premium only" ON premium_content
  FOR SELECT
  USING ((auth.jwt()->>'user_metadata')::jsonb->>'plan' = 'premium');

-- Supabase: auth.role()
-- PostgREST: current_setting('request.jwt.claim.role', true)
CREATE POLICY "Admin only" ON admin_logs
  FOR SELECT
  USING (auth.role() = 'admin');
```

**Public vs private data:**

```sql
-- Public data: visible to all (including anon)
CREATE POLICY "Public posts" ON posts
  FOR SELECT
  USING (is_public = true);

-- Private data: owner only
CREATE POLICY "Private posts" ON posts
  FOR SELECT
  USING (is_public = false AND user_id = auth.uid());

-- Combined in one policy
CREATE POLICY "View posts" ON posts
  FOR SELECT
  USING (is_public = true OR user_id = auth.uid());
```

**Important:**
- RLS is enforced at database level - secure even if API bypassed
- `FORCE ROW LEVEL SECURITY` applies RLS to table owners too
- Test policies thoroughly - incorrect policies leak or block data
- Use `auth.uid()` not `current_user` for user identification

Reference: [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
