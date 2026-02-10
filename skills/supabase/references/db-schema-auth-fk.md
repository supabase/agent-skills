---
title: Add CASCADE to auth.users Foreign Keys
impact: HIGH
impactDescription: Prevents orphaned records and user deletion failures
tags: foreign-keys, auth.users, cascade, schema-design
---

## Add CASCADE to auth.users Foreign Keys

When referencing `auth.users`, always specify `ON DELETE CASCADE`. Without it,
deleting users fails with foreign key violations.

**Incorrect:**

```sql
-- User deletion fails: "foreign key violation"
create table profiles (
  id uuid primary key references auth.users(id),
  username text,
  avatar_url text
);
```

**Correct:**

```sql
-- Profile deleted automatically when user is deleted
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text
);
```

## Alternative: SET NULL for Optional Relationships

Use `ON DELETE SET NULL` when the record should persist without the user:

```sql
create table comments (
  id bigint primary key generated always as identity,
  author_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz default now()
);
-- Comment remains with author_id = NULL after user deletion
```

## Auto-Create Profile on Signup

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Important:** Use `security definer` and `set search_path = ''` for triggers on
auth.users.

## Related

- [security-functions.md](security-functions.md)
- [Docs](https://supabase.com/docs/guides/database/postgres/cascade-deletes)
