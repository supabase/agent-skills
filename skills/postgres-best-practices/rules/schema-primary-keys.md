---
title: Select Optimal Primary Key Strategy
impact: HIGH
impactDescription: Better index locality, reduced fragmentation
tags: primary-key, identity, uuid, serial, schema
---

## Select Optimal Primary Key Strategy

Primary key choice affects insert performance, index size, and replication efficiency.

**Incorrect (problematic PK choices):**

```sql
-- identity is the SQL-standard approach
create table users (
  id serial primary key  -- Deprecated syntax
);

-- Random UUIDs cause index fragmentation
create table orders (
  id uuid default gen_random_uuid() primary key  -- Random = scattered inserts
);
```

**Correct (optimal PK strategies):**

```sql
-- Use IDENTITY for sequential IDs (best for most cases)
create table users (
  id bigint generated always as identity primary key
);

-- For distributed systems, use UUIDv7 (time-ordered) instead of UUIDv4
create table orders (
  id uuid default gen_random_uuid() primary key  -- OK if using UUIDv7 extension
);

-- Or use time-prefixed IDs for sortable, distributed IDs
create table events (
  id text default concat(
    to_char(now() at time zone 'utc', 'YYYYMMDDHH24MISSMS'),
    gen_random_uuid()::text
  ) primary key
);
```

Guidelines:

- Single database: `bigint identity` (sequential, 8 bytes)
- Distributed/exposed IDs: UUIDv7 or ULID (time-ordered, no fragmentation)
- Avoid: `serial` (deprecated), random UUIDs (fragmentation)

Reference: [Serial Types](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL)
