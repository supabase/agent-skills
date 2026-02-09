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
create table documents (
  content text,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding extensions.vector(512)
);
select * from documents where fts @@ to_tsquery('search');  -- Slow seq scan
```

**Correct:**

```sql
-- Add GIN index for full-text search
create table documents (
  content text,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding extensions.vector(512)
);
create index on documents using gin(fts);
create index on documents using hnsw (embedding vector_ip_ops);
select * from documents where fts @@ to_tsquery('search');  -- Fast index scan
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
-- Over-fetch 2x from each, then fuse and limit
with semantic as (select id from docs order by embedding <#> query limit 10),
     full_text as (select id from docs where fts @@ query limit 10)
-- Apply RRF scoring...
limit 5;
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
returns setof documents
language sql
as $$
with full_text as (
  select
    id,
    row_number() over(order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from documents
  where fts @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(match_count, 30) * 2
),
semantic as (
  select
    id,
    row_number() over (order by embedding <#> query_embedding) as rank_ix
  from documents
  order by rank_ix
  limit least(match_count, 30) * 2
)
select
  documents.*
from full_text
full outer join semantic on full_text.id = semantic.id
join documents on coalesce(full_text.id, semantic.id) = documents.id
order by
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit least(match_count, 30)
$$;
```

Parameters: `full_text_weight` and `semantic_weight` control how much each method contributes to the final rank (both default to 1). `rrf_k` is the RRF smoothing constant (default 50). The `least(match_count, 30)` caps results to prevent excessive over-fetching.

Use `<#>` (negative inner product) with `vector_ip_ops` index, or `<=>` (cosine distance) with `vector_cosine_ops` — ensure the operator matches your index.

## Related

- [search-semantic.md](search-semantic.md) - Vector-only search
- [Docs](https://supabase.com/docs/guides/ai/hybrid-search) - Hybrid search guide
