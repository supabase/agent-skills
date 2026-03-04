---
title: Enable Planner Optimizations for Global Ordering Across Buckets
impact: HIGH
impactDescription: Eliminates sort nodes — globally ordered results from bucket indexes with no SQL changes
tags: planner, derived-saops, merge-streams, global-ordering, cbo, yb_enable_derived_saops
---

## Enable Planner Optimizations for Global Ordering Across Buckets

YugabyteDB 2025.2.1 introduced planner optimizations that automatically rewrite queries to merge ordered streams from each bucket — producing globally ordered results without a sort node and without any SQL or application changes.

**Incorrect (missing planner settings — sort node added):**

```sql
-- Without these settings, the planner adds a Sort node on top of the index scan
-- This materializes all matching rows before sorting — slow and memory-intensive
SELECT "timestamp"
FROM events
WHERE "timestamp" >= '2025-01-01'
  AND "timestamp" <  '2026-01-01'
ORDER BY "timestamp";

-- Plan shows: Sort -> Index Scan (expensive)
```

**Correct (enable merge-stream execution):**

```sql
-- Enable the three required planner settings
SET yb_enable_derived_saops = true;
SET yb_max_saop_merge_streams = 64;
SET yb_enable_cbo = on;

-- Run ANALYZE to ensure statistics are up to date
ANALYZE events;

-- Same query, same index — no sort node
SELECT "timestamp"
FROM events
WHERE "timestamp" >= '2025-01-01'
  AND "timestamp" <  '2026-01-01'
ORDER BY "timestamp";
```

```
Index Only Scan using events_timestamp_idx on events (actual rows=10000000 loops=1)
  Index Cond: (("timestamp" >= '2025-01-01') AND ("timestamp" < '2026-01-01')
    AND (((yb_hash_code("timestamp") % 3)) = ANY ('{0,1,2}'::integer[])))
  Merge Sort Key: "timestamp"
  Merge Stream Key: (yb_hash_code("timestamp") % 3)
  Merge Streams: 3
```

No Sort node — pggate merges the 3 ordered streams on the fly.

### Make Settings Persistent

```sql
-- Set at the database level so all sessions use them
ALTER DATABASE yugabyte SET yb_enable_derived_saops = true;
ALTER DATABASE yugabyte SET yb_max_saop_merge_streams = 64;
ALTER DATABASE yugabyte SET yb_enable_cbo = on;
```

### What Each Setting Does

| Setting | Purpose |
|---------|---------|
| `yb_enable_derived_saops` | Allows planner to inject `= ANY('{0,1,2,...}')` conditions for the bucket column |
| `yb_max_saop_merge_streams` | Maximum number of merge streams (set ≥ your bucket count) |
| `yb_enable_cbo` | Enables cost-based optimizer for better plan selection |

### Prerequisites

- YugabyteDB 2025.2.1 or later
- `ANALYZE` must have been run on the table (CBO needs statistics)
- The index must use the bucket pattern with `ASC` ordering

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
