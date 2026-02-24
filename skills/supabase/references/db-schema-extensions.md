---
title: Install Extensions in extensions Schema
tags: extensions, schema-design, best-practices
---

## Install Extensions in extensions Schema

Install PostgreSQL extensions in the `extensions` schema to keep the `public`
schema clean and avoid conflicts with application tables.

**Incorrect:**

```sql
-- Installs in public schema by default
create extension pg_trgm;
create extension pgvector;
```

**Correct:**

```sql
-- Install in extensions schema
create extension if not exists pg_trgm with schema extensions;
create extension if not exists vector with schema extensions;

-- Reference with schema prefix
create index idx_name_trgm on users
  using gin(name extensions.gin_trgm_ops);
```

## Common Supabase Extensions

```sql
-- Vector similarity search (AI embeddings)
create extension if not exists vector with schema extensions;

-- Scheduled jobs (pg_cron requires pg_catalog, not extensions)
create extension if not exists pg_cron with schema pg_catalog;

-- HTTP requests from database (pg_net creates its own 'net' schema)
create extension if not exists pg_net;

-- Full-text search improvements
create extension if not exists pg_trgm with schema extensions;

-- Geospatial data
create extension if not exists postgis with schema extensions;

-- UUID generation (enabled by default)
create extension if not exists "uuid-ossp" with schema extensions;
```

## Check Available Extensions

```sql
-- List available extensions
select * from pg_available_extensions;

-- List installed extensions
select * from pg_extension;
```

## Using Extensions

```sql
-- pgvector example (use extensions. prefix for type)
create table if not exists documents (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text,
  embedding extensions.vector(1536)  -- OpenAI ada-002 dimensions
);

-- Always use HNSW (not IVFFlat) — better recall, no training step
create index if not exists documents_embedding_idx
  on documents using hnsw (embedding extensions.vector_cosine_ops);
```

## Related

- [Docs](https://supabase.com/docs/guides/database/extensions)
