---
title: Maintain Table Statistics with VACUUM and ANALYZE
impact: MEDIUM
impactDescription: 2-10x better query plans with accurate statistics
tags: vacuum, analyze, statistics, maintenance, autovacuum
---

## Maintain Table Statistics with VACUUM and ANALYZE

Outdated statistics cause the query planner to make poor decisions. VACUUM reclaims dead tuples and makes space reusable; ANALYZE updates statistics.

**Incorrect (stale statistics):**

```sql
-- Table has 1M rows but stats say 1000
-- Query planner chooses wrong strategy
explain select * from orders where status = 'pending';
-- Shows: Seq Scan (because stats show small table)
-- Actually: Index Scan would be much faster
```

**Correct (maintain fresh statistics):**

```sql
-- Manually analyze after large data changes
analyze orders;

-- Analyze specific columns used in WHERE clauses
analyze orders (status, created_at);

-- Check when tables were last analyzed
select
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  greatest(last_analyze, last_autoanalyze) as last_analyzed
from pg_stat_user_tables
order by greatest(last_analyze, last_autoanalyze) nulls first;
```

Autovacuum tuning for busy tables:

```sql
-- Increase frequency for high-churn tables
alter table orders set (
  autovacuum_vacuum_scale_factor = 0.05,     -- Vacuum at 5% dead tuples (default 20%)
  autovacuum_analyze_scale_factor = 0.02     -- Analyze at 2% changes (default 10%)
);

-- Inspect running vacuum/autovacuum activity
select * from pg_stat_progress_vacuum;
```

Reference: [VACUUM](https://supabase.com/docs/guides/database/database-size#vacuum-operations)
