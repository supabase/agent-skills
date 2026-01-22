---
title: Access JWT Claims in SQL for Custom Logic
impact: MEDIUM
impactDescription: Use JWT data in RLS policies and functions
tags: jwt, claims, rls, policies, current_setting
---

## Access JWT Claims in SQL for Custom Logic

Access JWT claims in PostgreSQL using `current_setting()` or Supabase's `auth.jwt()` helper. Use claims in RLS policies, functions, and triggers.

**Incorrect (hardcoding or passing user info):**

```bash
# Don't pass user info in request - can be faked
curl "http://localhost:3000/posts" \
  -X POST \
  -d '{"title": "Post", "user_id": 123}'  # User could fake this!
```

**Correct (extract from JWT in SQL):**

```sql
-- PostgREST sets JWT claims as settings
-- Access full claims JSON
SELECT current_setting('request.jwt.claims', true)::json;

-- Access specific claim
SELECT current_setting('request.jwt.claims', true)::json->>'sub';
SELECT current_setting('request.jwt.claims', true)::json->>'email';
SELECT current_setting('request.jwt.claims', true)::json->>'role';

-- Supabase helper functions (recommended)
SELECT auth.uid();       -- User ID (sub claim)
SELECT auth.role();      -- Current role
SELECT auth.jwt();       -- Full JWT as JSONB
SELECT auth.email();     -- User email
```

**RLS policies using claims:**

```sql
-- User can only see own data
CREATE POLICY "Own data" ON profiles
  FOR ALL
  USING (user_id = auth.uid());

-- Access based on custom claim
CREATE POLICY "Organization members" ON org_data
  FOR SELECT
  USING (
    org_id = (auth.jwt()->>'org_id')::uuid
  );

-- Premium users only
CREATE POLICY "Premium content" ON premium_articles
  FOR SELECT
  USING (
    (auth.jwt()->'app_metadata'->>'subscription')::text = 'premium'
  );

-- Role-based access
CREATE POLICY "Admin only" ON admin_settings
  FOR ALL
  USING (auth.role() = 'admin');
```

**Auto-populate user_id on insert:**

```sql
-- Trigger to set user_id from JWT
CREATE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER posts_set_user_id
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
```

```bash
# Now user_id is auto-set from JWT
curl "http://localhost:3000/posts" \
  -X POST \
  -H "Authorization: Bearer user-jwt" \
  -d '{"title": "My Post"}'  # user_id set automatically
```

**Using claims in functions:**

```sql
CREATE FUNCTION get_my_posts()
RETURNS SETOF posts AS $$
  SELECT * FROM posts WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt()->'app_metadata'->>'org_role')::text = 'admin';
$$ LANGUAGE SQL STABLE;
```

**Common claims:**

| Claim | Description | Access |
|-------|-------------|--------|
| `sub` | User ID | `auth.uid()` |
| `email` | User email | `auth.jwt()->>'email'` |
| `role` | Database role | `auth.role()` |
| `app_metadata` | Custom app data | `auth.jwt()->'app_metadata'` |
| `user_metadata` | User-editable data | `auth.jwt()->'user_metadata'` |

Reference: [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/row-level-security#helper-functions)
