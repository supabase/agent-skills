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
with semantic as (select id from docs order by embedding <#> query limit 5),
     full_text as (select id from docs where fts @@ query limit 5)
select * from semantic union full_text limit 5;
```

**Correct:**

```sql
-- Over-fetch 2x with least() cap, then fuse and limit
with semantic as (select id from docs order by embedding <#> query limit least(5, 30) * 2),
     full_text as (select id from docs where fts @@ query limit least(5, 30) * 2)
-- Apply RRF scoring...
limit least(5, 30);
```

## Complete Hybrid Search Function

```sql
create or replace function hybrid_search(
  query_text text,
  query_embedding extensions.vector(512),
  match_count int,
  full_text_weight float = 1,
  semantic_weight float = 1,
  rrf_k int = 50
)
returns setof documents language sql as $$
with full_text as (
  select id, row_number() over (order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from documents where fts @@ websearch_to_tsquery(query_text)
  limit least(match_count, 30) * 2
),
semantic as (
  select id, row_number() over (order by embedding <#> query_embedding) as rank_ix
  from documents
  order by embedding <#> query_embedding
  limit least(match_count, 30) * 2
)
select documents.* from full_text
full outer join semantic on full_text.id = semantic.id
join documents on coalesce(full_text.id, semantic.id) = documents.id
order by
  coalesce(1.0/(rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0/(rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit least(match_count, 30);
$$;
```

## Related

- [search-semantic.md](search-semantic.md) - Vector-only search
- [Docs](https://supabase.com/docs/guides/ai/hybrid-search) - Hybrid search guide
