---
title: Enable RLS on All Exposed Schemas
impact: CRITICAL
impactDescription: Prevents unauthorized data access at the database level
tags: rls, security, auth, policies
---

## Enable RLS on All Exposed Schemas

RLS must be enabled on every table in exposed schemas (default: `public`). Without
RLS, any user with the anon key can read and write all data.

**Incorrect:**

```sql
-- Table without RLS - anyone can read/write everything
create table profiles (
  id uuid primary key,
  user_id uuid,
  bio text
);
```

**Correct:**

```sql
create table profiles (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  bio text
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policy
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);
```

Tables created via Dashboard have RLS enabled by default. Tables created via SQL
require manual enablement. Supabase sends daily warnings for tables without RLS.

**Note:** Service role key bypasses RLS policies only when no user is signed in.
If a user is authenticated, Supabase adheres to that user's RLS policies even
when the client is initialized with the service role key. Never expose the
service role key to browsers.

## Related

- [Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
