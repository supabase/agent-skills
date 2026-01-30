---
title: Combine Vector and Full-Text Search with Hybrid Search
impact: HIGH
impactDescription: 20-40% relevance improvement over pure vector search
tags: hybrid-search, full-text, rrf, tsvector, metadata-filter
---

## Combine Vector and Full-Text Search with Hybrid Search

Hybrid search combines semantic similarity (vectors) with keyword matching (full-text) using Reciprocal Rank Fusion (RRF).

## 1. Missing GIN Index on tsvector

Full-text search without an index is extremely slow.

**Incorrect:**

```sql
-- No index on tsvector column
create table docs (
  fts tsvector generated always as (to_tsvector('english', content)) stored
);
select * from docs where fts @@ to_tsquery('search');  -- Slow seq scan
```

**Correct:**

```sql
-- Add GIN index for full-text search
create table docs (
  fts tsvector generated always as (to_tsvector('english', content)) stored
);
create index on docs using gin(fts);
select * from docs where fts @@ to_tsquery('search');  -- Fast index scan
```

## 2. Not Over-Fetching Before Fusion

Fetching exact match_count from each source may miss relevant results after fusion.

**Incorrect:**

```sql
-- May miss good results after RRF fusion
with semantic as (select id from docs order by embedding <=> query limit 5),
     full_text as (select id from docs where fts @@ query limit 5)
select * from semantic union full_text limit 5;
```

**Correct:**

```sql
-- Fetch 2x from each, then fuse and limit
with semantic as (select id from docs order by embedding <=> query limit 10),
     full_text as (select id from docs where fts @@ query limit 10)
-- Apply RRF scoring...
limit 5;
```

## Complete Hybrid Search Function

```sql
create function hybrid_search(
  query_text text,
  query_embedding vector(1536),
  match_count int default 10
)
returns setof documents language sql stable security invoker as $$
with full_text as (
  select id, row_number() over (order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from documents where fts @@ websearch_to_tsquery(query_text)
  limit match_count * 2
),
semantic as (
  select id, row_number() over (order by embedding <=> query_embedding) as rank_ix
  from documents
  order by embedding <=> query_embedding
  limit match_count * 2
)
select documents.* from full_text
full outer join semantic on full_text.id = semantic.id
join documents on coalesce(full_text.id, semantic.id) = documents.id
order by coalesce(1.0/(50+full_text.rank_ix),0) + coalesce(1.0/(50+semantic.rank_ix),0) desc
limit match_count;
$$;
```

## Related

- [search-semantic.md](search-semantic.md) - Vector-only search
- [Docs](https://supabase.com/docs/guides/ai/hybrid-search) - Hybrid search guide
