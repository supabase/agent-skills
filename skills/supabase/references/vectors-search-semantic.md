---
title: Implement Semantic Search with match_documents
impact: CRITICAL
impactDescription: Core pattern for similarity search in Supabase applications
tags: semantic-search, match_documents, similarity, rpc, supabase-js
---

## Implement Semantic Search with match_documents

Create a PostgreSQL function to search vectors, then call it via supabase-js `.rpc()`.

## 1. Missing security invoker

Without `security invoker`, the function bypasses RLS and exposes all data.

**Incorrect:**

```sql
-- Function runs as definer, bypasses RLS
create function match_documents(query_embedding vector(1536), match_count int)
returns setof documents language sql as $$
  select * from documents order by embedding <=> query_embedding limit match_count;
$$;
```

**Correct:**

```sql
-- Respects caller's RLS policies
create function match_documents(query_embedding vector(1536), match_count int)
returns setof documents language sql stable security invoker as $$
  select * from documents order by embedding <=> query_embedding limit match_count;
$$;
```

## 2. Ordering by Calculated Column

Ordering by a calculated similarity column bypasses the index.

**Incorrect:**

```sql
-- Index not used
select *, 1 - (embedding <=> query) as similarity
from documents
order by similarity desc;
```

**Correct:**

```sql
-- Order by distance operator directly (uses index)
select *, 1 - (embedding <=> query) as similarity
from documents
order by embedding <=> query
limit 10;
```

## Complete match_documents Function

```sql
create or replace function match_documents (
  query_embedding extensions.vector(1536),
  match_threshold float default 0.78,
  match_count int default 10
)
returns table (id bigint, content text, similarity float)
language sql stable security invoker
as $$
  select id, content, 1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit least(match_count, 200);
$$;
```

## Calling from supabase-js

```typescript
const { data } = await supabase.rpc('match_documents', {
  query_embedding: embedding,
  match_threshold: 0.78,
  match_count: 10,
})
```

## Related

- [search-hybrid.md](search-hybrid.md) - Combine with full-text search
- [Docs](https://supabase.com/docs/guides/ai/semantic-search) - Semantic search guide
