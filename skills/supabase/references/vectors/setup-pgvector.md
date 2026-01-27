---
title: Enable pgvector for Vector Storage
impact: HIGH
impactDescription: Foundation for all vector search and AI features in Supabase
tags: pgvector, vector, halfvec, dimensions, extension, embeddings
---

## Enable pgvector for Vector Storage

pgvector stores high-dimensional vectors (embeddings) in Postgres for similarity search.

## 1. Dimension Mismatch

Embedding dimensions must match between column definition and inserted data.

**Incorrect:**

```sql
-- Column is 1536, inserting 384-dim vector
create table docs (embedding extensions.vector(1536));
insert into docs (embedding) values ('[0.1, ...]'::vector(384));  -- ERROR
```

**Correct:**

```sql
-- Match dimensions to your embedding model (gte-small = 384)
create table docs (embedding extensions.vector(384));
insert into docs (embedding) values ('[0.1, ...]'::vector(384));
```

## 2. Comparing Different Embedding Models

Comparing embeddings from different models produces meaningless results.

**Incorrect:**

```sql
-- Mixing OpenAI (1536-dim) with gte-small (384-dim) embeddings
-- Even if dimensions matched, semantics differ
select * from docs order by openai_embedding <=> gte_embedding;
```

**Correct:**

```sql
-- Use one model consistently per column
create table docs (
  embedding extensions.vector(1536)  -- OpenAI only
);
```

## Quick Reference

| Type | Max Indexed Dims | Use Case |
|------|------------------|----------|
| `vector(n)` | 2,000 | Standard embeddings |
| `halfvec(n)` | 4,000 | Large models (3072 dims) |

| Model | Dimensions |
|-------|-----------|
| OpenAI text-embedding-3-small | 1536 |
| Supabase gte-small | 384 |

## Related

- [index-hnsw.md](index-hnsw.md) - Create indexes for fast search
- [search-semantic.md](search-semantic.md) - Query vectors with match_documents
- [Docs](https://supabase.com/docs/guides/ai/vector-columns) - Vector columns guide
