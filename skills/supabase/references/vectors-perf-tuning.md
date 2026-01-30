---
title: Optimize Vector Search Performance
impact: CRITICAL
impactDescription: 2-10x latency reduction with proper tuning
tags: performance, pre-warming, compute, batch, monitoring
---

## Optimize Vector Search Performance

Vector search is RAM-bound. Proper tuning and compute sizing are critical.

## 1. Undersized Compute for Vector Workload

Vector indexes must fit in RAM for optimal performance.

**Incorrect:**

```sql
-- Free tier (1GB RAM) with 100K 1536-dim vectors
-- Symptoms: high disk reads, slow queries
select count(*) from documents;  -- Returns 100000
```

**Correct:**

```sql
-- Check buffer cache hit ratio
select round(100.0 * heap_blks_hit / nullif(heap_blks_hit + heap_blks_read, 0), 2) as hit_ratio
from pg_statio_user_tables where relname = 'documents';
-- If < 95%, upgrade compute or reduce data
```

## 2. Building Index During Peak Traffic

Non-concurrent index builds lock the table.

**Incorrect:**

```sql
-- Locks table, impacts all queries
create index on documents using hnsw (embedding vector_cosine_ops);
```

**Correct:**

```sql
-- No lock, runs in background
create index concurrently on documents using hnsw (embedding vector_cosine_ops);
```

## Compute Sizing

| Plan | RAM | Vectors (1536d) |
|------|-----|-----------------|
| Free | 1GB | ~20K |
| Small | 2GB | ~50K |
| Medium | 4GB | ~100K |
| Large | 8GB | ~250K |

## Index Pre-Warming

```sql
-- Load index into memory before production traffic
select pg_prewarm('documents_embedding_idx');

-- Run 10K-50K warm-up queries before benchmarking
```

## Index Build Settings

```sql
set maintenance_work_mem = '4GB';
set max_parallel_maintenance_workers = 4;
set statement_timeout = '0';
```

## Query Monitoring

```sql
-- Find slow vector queries
select substring(query, 1, 80), calls, round(mean_exec_time::numeric, 2) as avg_ms
from pg_stat_statements
where query like '%<=>%' or query like '%<#>%'
order by total_exec_time desc limit 10;
```

## Related

- [index-hnsw.md](index-hnsw.md) - HNSW parameters
- [Docs](https://supabase.com/docs/guides/ai/going-to-prod) - Production guide
- [Docs](https://supabase.com/docs/guides/ai/choosing-compute-addon) - Compute sizing
