---
title: Configure HNSW Indexes for Fast Vector Search
impact: CRITICAL
impactDescription: 10-100x faster queries with proper HNSW configuration
tags: hnsw, index, m, ef_construction, ef_search, cosine, inner-product
---

## Configure HNSW Indexes for Fast Vector Search

HNSW (Hierarchical Navigable Small World) is the recommended index type for vector search in Supabase.

## 1. Mismatched Operator Class

Index operator class must match the query distance operator.

**Incorrect:**

```sql
-- Index uses cosine, query uses inner product
create index on docs using hnsw (embedding vector_cosine_ops);
select * from docs order by embedding <#> query_embedding;  -- Won't use index
```

**Correct:**

```sql
-- Match operator class to distance function
create index on docs using hnsw (embedding vector_ip_ops);
select * from docs order by embedding <#> query_embedding;  -- Uses index
```

## 2. Non-Concurrent Index Build

Building indexes without CONCURRENTLY locks the table.

**Incorrect:**

```sql
-- Locks table during build (bad for production)
create index on documents using hnsw (embedding vector_cosine_ops);
```

**Correct:**

```sql
-- No table lock
create index concurrently on documents using hnsw (embedding vector_cosine_ops);
```

## Distance Operators

| Operator | Name | Index Class | Best For |
|----------|------|-------------|----------|
| `<=>` | Cosine | `vector_cosine_ops` | Safe default |
| `<#>` | Negative Inner Product | `vector_ip_ops` | Normalized vectors (fastest) |
| `<->` | Euclidean | `vector_l2_ops` | Absolute distances |

**Note:** `<#>` returns negative inner product, so smaller values = more similar. Order ASC for most similar first.

## HNSW Parameters

```sql
-- Custom parameters for higher recall
create index on documents using hnsw (embedding vector_cosine_ops)
with (m = 24, ef_construction = 100);

-- Query-time tuning
set hnsw.ef_search = 100;  -- Default is 40
```

## Related

- [index-ivfflat.md](index-ivfflat.md) - Alternative index for specific cases
- [perf-tuning.md](perf-tuning.md) - Pre-warming and compute sizing
- [Docs](https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes) - HNSW guide
