---
title: Use IVFFlat for Large-Scale Vector Collections
impact: MEDIUM-HIGH
impactDescription: Faster index creation for 1M+ vectors with acceptable recall
tags: ivfflat, index, lists, probes, large-scale
---

## Use IVFFlat for Large-Scale Vector Collections

IVFFlat divides vectors into clusters for faster search. Use HNSW unless you have specific requirements.

## 1. Creating IVFFlat on Empty Table

IVFFlat needs data to create meaningful clusters.

**Incorrect:**

```sql
-- No data to cluster - poor index quality
create table docs (embedding vector(1536));
create index on docs using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

**Correct:**

```sql
-- Add substantial data first, then create index
create table docs (embedding vector(1536));
insert into docs (embedding) select ...;  -- Add data
create index on docs using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

## 2. Setting Probes Equal to Lists

When probes equals lists, the index is not used (sequential scan).

**Incorrect:**

```sql
-- If lists = 100, this defeats the purpose of the index
set ivfflat.probes = 100;
```

**Correct:**

```sql
-- probes should be much smaller than lists
set ivfflat.probes = 10;  -- ~10% of lists
```

## IVFFlat vs HNSW

| Aspect | HNSW | IVFFlat |
|--------|------|---------|
| Build speed | Slower | Faster |
| Query speed | Faster | Slower |
| Empty table | Works | Needs data |
| Updates | Handles well | May need rebuild |

## Lists Recommendations

| Rows | Lists |
|------|-------|
| < 1M | sqrt(rows) up to 1000 |
| ≥ 1M | rows/1000 up to 4000 |

## Related

- [index-hnsw.md](index-hnsw.md) - Recommended index type
- [Docs](https://supabase.com/docs/guides/ai/vector-indexes/ivf-indexes) - IVFFlat guide
