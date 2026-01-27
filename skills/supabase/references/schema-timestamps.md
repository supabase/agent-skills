---
title: Always Use timestamptz Not timestamp
impact: MEDIUM-HIGH
impactDescription: Prevents timezone-related bugs and data inconsistencies
tags: timestamps, timestamptz, timezone, data-types
---

## Always Use timestamptz Not timestamp

Use `timestamptz` (timestamp with time zone) instead of `timestamp`. The latter
loses timezone information, causing bugs when users are in different timezones.

**Incorrect:**

```sql
create table events (
  id bigint primary key generated always as identity,
  name text not null,
  -- Stores time without timezone context
  created_at timestamp default now(),
  starts_at timestamp
);
```

**Correct:**

```sql
create table events (
  id bigint primary key generated always as identity,
  name text not null,
  -- Stores time in UTC, converts on retrieval
  created_at timestamptz default now(),
  starts_at timestamptz
);
```

## How timestamptz Works

- Stores time in UTC internally
- Converts to/from session timezone automatically
- `now()` returns current time in session timezone, stored as UTC

```sql
-- Insert with timezone
insert into events (name, starts_at)
values ('Launch', '2024-03-15 10:00:00-05');  -- EST

-- Retrieved in UTC by default in Supabase
select starts_at from events;
-- 2024-03-15 15:00:00+00
```

## Auto-Update updated_at Column

```sql
create table posts (
  id bigint primary key generated always as identity,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to auto-update
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();
```

## Related

- [Docs](https://supabase.com/docs/guides/database/tables)
