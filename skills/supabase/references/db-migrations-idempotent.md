---
title: Write Idempotent Migrations
impact: HIGH
impactDescription: Safe to run multiple times, prevents migration failures
tags: migrations, idempotent, supabase-cli
---

## Write Idempotent Migrations

Migrations should be safe to run multiple times without errors. Use
`IF NOT EXISTS` and `IF EXISTS` clauses.

**Incorrect:**

```sql
-- Fails on second run: "relation already exists"
create table users (
  id uuid primary key,
  email text not null
);

create index idx_users_email on users(email);
```

**Correct:**

```sql
-- Safe to run multiple times
create table if not exists users (
  id uuid primary key,
  email text not null
);

create index if not exists idx_users_email on users(email);
```

## Idempotent Column Additions

```sql
-- Add column only if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'users' and column_name = 'phone'
  ) then
    alter table users add column phone text;
  end if;
end $$;
```

## Idempotent Drops

```sql
-- Safe drops
drop table if exists old_table;
drop index if exists old_index;
drop function if exists old_function();
```

## Idempotent Policies

```sql
-- Drop and recreate to update policy
drop policy if exists "Users see own data" on users;

create policy "Users see own data" on users
  for select to authenticated
  using ((select auth.uid()) = id);
```

## Migration File Naming

Migrations in `supabase/migrations/` are named with timestamps:

```
20240315120000_create_users.sql
20240315130000_add_profiles.sql
```

Create new migration:

```bash
npx supabase migration new create_users
```

## Related

- [migrations-testing.md](migrations-testing.md)
- [Docs](https://supabase.com/docs/guides/deployment/database-migrations)
