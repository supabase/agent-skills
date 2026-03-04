---
title: Add INCLUDE Columns to Bucket Indexes for Index-Only Scans
impact: MEDIUM-HIGH
impactDescription: Eliminates distributed heap fetches — 0 heap fetches, 2-3ms for top-N queries
tags: covering-index, include, index-only-scan, heap-fetch, bucket
---

## Add INCLUDE Columns to Bucket Indexes for Index-Only Scans

In YugabyteDB, heap fetches on non-colocated tables require cross-node RPCs. Adding frequently accessed columns via `INCLUDE` to bucket indexes enables index-only scans that avoid these expensive round trips.

**Incorrect (heap fetches required):**

```sql
-- Index covers only timestamp — reading id requires heap fetch per row
CREATE INDEX events_timestamp_idx ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) SPLIT AT VALUES ((1), (2));

-- Each row triggers a distributed heap fetch
SELECT id, "timestamp" FROM events
WHERE "timestamp" >= '2025-01-01'
ORDER BY "timestamp" LIMIT 1000;
```

**Correct (index-only scan, zero heap fetches):**

```sql
-- INCLUDE (id) enables index-only scan
CREATE INDEX events_timestamp_idx ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) INCLUDE (id)
  SPLIT AT VALUES ((1), (2));

-- Index-only scan — no heap fetches needed
SELECT id, "timestamp" FROM events
WHERE "timestamp" >= '2025-01-01'
ORDER BY "timestamp" LIMIT 1000;
```

EXPLAIN output confirms zero heap fetches:

```
Limit (actual time=1.682..2.258 rows=1000 loops=1)
  ->  Index Only Scan using events_timestamp_idx on events
        Heap Fetches: 0
        Storage Index Rows Scanned: 3000
```

### Guidelines

- Include columns that appear in your SELECT list but not in the index key
- Don't over-include — each included column increases index size
- For colocated tables, heap fetches are local, so INCLUDE is less impactful
- The bucket expression column does not need to be INCLUDEd (it's already in the key)

Reference: [YugabyteDB Covering Indexes](https://docs.yugabyte.com/stable/explore/indexes-constraints/covering-index-ysql/)
